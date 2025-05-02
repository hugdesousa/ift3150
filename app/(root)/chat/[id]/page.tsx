/* =========================================================================
   app/(root)/chat/[id]/page.tsx – conversation + messages + events persistés
   ========================================================================= */

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  conversations,
  messages as msg,
  chat_events as evt,
  workers as wrk,
} from "@/database/schema";
import { eq, asc, desc } from "drizzle-orm";

import type {
  ChatConversation,
  ChatMessage,
  ChatEvent,
  AppointmentRequestedPayload,
  AppointmentConfirmedPayload,
  AppointmentCancelledPayload,
  AppointmentCompletedPayload,
} from "@/types";

export const dynamic = "force-dynamic";

const toDate = (d: unknown): Date =>
  d instanceof Date ? d : new Date(d as string);

export default async function Page({ params }: { params: { id: string } }) {
  const param = await params;
  const convId = param.id;

  /* -------- auth ------------------------------------------------- */
  const session = await auth();
  const role = session?.user?.role ?? null;
  const userId = session?.user?.id ?? null;
  const guestToken = (await cookies()).get("guest_token")?.value ?? null;

  /* -------- workerId si HELPR ----------------------------------- */
  let myWorkerId: string | null = null;
  if (role === "HELPR" && userId) {
    const w = await db.query.workers.findFirst({
      where: eq(wrk.id, userId),
      columns: { id: true },
    });
    myWorkerId = w?.id ?? null;
  }

  /* -------- conversation + 10 derniers messages ------------------ */
  const raw = await db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: {
      worker: true,
      user: true,
      guestSession: true,
      messages: {
        orderBy: [desc(msg.created_at)], // plus récents d'abord
        limit: 10,
      },
    },
  });
  if (!raw) notFound();

  /* -------- ACL -------------------------------------------------- */
  const allowed =
    (role === "HELPR" && myWorkerId === raw.worker_id) ||
    (role !== "HELPR" && raw.user_id !== null && raw.user_id === userId) ||
    (role !== "HELPR" &&
      raw.user_id === null &&
      raw.guest_session_id === guestToken);
  if (!allowed) notFound();

  /* -------- événements rendez-vous ------------------------------- */
  const rows = await db
    .select({
      id: evt.id,
      created_at: evt.created_at,
      sender_id: evt.sender_id,
      kind: evt.kind,
      payload: evt.payload,
    })
    .from(evt)
    .where(eq(evt.conversation_id, convId))
    .orderBy(asc(evt.created_at));

  const events: ChatEvent[] = rows.map((r) => {
    const p: any = r.payload ?? {};
    if (p.start) p.start = toDate(p.start);
    if (p.end) p.end = toDate(p.end);

    return {
      id: r.id,
      conversation_id: convId,
      sender_id: r.sender_id ?? raw.worker_id!,
      created_at: toDate(r.created_at!),
      type: r.kind as ChatEvent["type"],
      payload: p,
    };
  });

  /* -------- messages (remis en ordre ascendant) ------------------ */
  const messages: ChatMessage[] = raw.messages
    .reverse() // ordre chronologique
    .map((m) => ({
      id: m.id,
      content: m.content,
      created_at: toDate(m.created_at),
      sender_type: m.sender_type as "user" | "worker" | "guest",
      sender_id: m.sender_id,
      guest_session_id: m.guest_session_id ?? null,
      receiver_id: m.receiver_id,
      status: m.status,
      read_at: m.read_at ? toDate(m.read_at) : null,
    }));

  /* -------- props vers le client -------------------------------- */
  const conversation: ChatConversation = {
    id: raw.id,
    worker: {
      id: raw.worker!.id,
      full_name: raw.worker!.full_name,
      profile_image_url: raw.worker!.profile_image_url ?? null,
    },
    user: raw.user
      ? {
          id: raw.user.id,
          full_name: raw.user.full_name,
          profile_image_url: raw.user.profile_image_url ?? null,
        }
      : null,
    guestSession: raw.guestSession
      ? {
          id: raw.guestSession.id,
          full_name: raw.guestSession.full_name ?? "Invité",
        }
      : null,
    messages,
    events,
  };

  const ChatClient = (await import("../../../../components/chat/ChatClient"))
    .default;
  return <ChatClient conversation={conversation} />;
}
