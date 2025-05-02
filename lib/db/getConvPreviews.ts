import { db } from "@/database/drizzle";
import { conversations, messages, chat_events } from "@/database/schema";
import { eq, desc, sql, and, isNull, or } from "drizzle-orm";
import type { ConvPreview } from "@/components/chat/ChatListClient";

type Args = { userId: string | null; guestId: string | null; role?: string | null };

export async function getConvPreviews({ userId, guestId, role }: Args) {
  const isWorker = role === "HELPR";

  /* --- portée des conversations visibles par le lecteur -------- */
  const where = isWorker
    ? eq(conversations.worker_id, userId!)
    : userId
      ? eq(conversations.user_id, userId)
      : eq(conversations.guest_session_id, guestId!);

  /* --- conversations avec dernier message ---------------------- */
  const rows = await db.query.conversations.findMany({
    where,
    with: {
      worker: true,
      user: true,
      guestSession: true,
      messages: { orderBy: [desc(messages.created_at)], limit: 1 },
    },
    orderBy: [desc(conversations.last_message_at)],
  });

  const previews: ConvPreview[] = [];

  for (const c of rows) {
    /* ---------- participant (id / type / nom / photo) ---------- */
    let participant: ConvPreview["participant"];

    if (isWorker) {
      // le lecteur EST un worker → participant = user OU guest
      if (c.user) {
        participant = {
          id: c.user.id,
          type: "user",
          full_name: c.user.full_name,
          profile_image_url: c.user.profile_image_url,
        };
      } else {
        participant = {
          id: c.guestSession?.id ?? "",
          type: "guest",
          full_name: c.guestSession?.full_name ?? "Invité",
          profile_image_url: null,
        };
      }
    } else {
      // lecteur = user / guest → participant = worker
      participant = {
        id: c.worker!.id ?? "",
        type: "worker" as const, // ← GARANTI "worker"
        full_name: c.worker!.full_name,
        profile_image_url: c.worker!.profile_image_url,
      };
    }

    /* ---------- nombre de messages non lus --------------------- */
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversation_id, c.id),
          isNull(messages.read_at),
          isWorker
            ? or(
                eq(messages.sender_type, "user"),
                eq(messages.sender_type, "guest"),
              )
            : eq(messages.sender_type, "worker"),
        ),
      );

    /* ---------- dernier chat-event (≤1) ------------------------ */
    const evt = await db.query.chat_events.findFirst({
      where: eq(chat_events.conversation_id, c.id),
      orderBy: [desc(chat_events.created_at)],
      columns: { kind: true, sender_id: true, created_at: true },
    });

    /* ---------- push dans le tableau --------------------------- */
    previews.push({
      id: c.id,
      participant,
      last_message: c.messages[0]
        ? {
            content: c.messages[0].content,
            created_at: c.messages[0].created_at!,
          }
        : null,
      last_event: evt
        ? {
            kind: evt.kind,
            sender_id: evt.sender_id,
            created_at: evt.created_at!,
          }
        : null,
      unread_count: Number(count),
    });
  }

  return previews;
}
