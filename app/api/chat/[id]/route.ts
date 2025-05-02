/* ------------------------------------------------------------------
   GET /api/chat/[id]
   – retourne la conversation, ses messages ET tous les chat_events
------------------------------------------------------------------ */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  conversations,
  messages,
  chat_events,
  workers,
} from "@/database/schema";
import { eq, asc, and, inArray } from "drizzle-orm";

const EVENT_KINDS = [
  "appointment_requested",
  "appointment_confirmed",
  "appointment_completed",
  "appointment_cancelled",
  "appointment_archived",
] as const;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = session?.guestSession?.id ?? null;
  if (!userId && !guestId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  /* suis-je le worker ? */
  const workerRow = userId
    ? await db.query.workers.findFirst({
        where: eq(workers.id, userId),
        columns: { id: true },
      })
    : null;

  const conv = await db.query.conversations.findFirst({
    where: workerRow
      ? and(
          eq(conversations.id, params.id),
          eq(conversations.worker_id, workerRow.id),
        )
      : userId
        ? and(
            eq(conversations.id, params.id),
            eq(conversations.user_id, userId),
          )
        : and(
            eq(conversations.id, params.id),
            eq(conversations.guest_session_id, guestId!),
          ),
    with: {
      worker: true,
      user: true,
      guestSession: true,
      messages: { orderBy: [asc(messages.created_at)] },
    },
  });
  if (!conv)
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );

  const events = await db
    .select()
    .from(chat_events)
    .where(
      and(
        eq(chat_events.conversation_id, params.id),
        inArray(chat_events.kind, EVENT_KINDS),
      ),
    )
    .orderBy(asc(chat_events.created_at));

  return NextResponse.json({ ...conv, events });
}
