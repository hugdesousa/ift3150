/* ------------------------------------------------------------------
   POST /api/reserve – création d’un RDV (REQUESTED ou CONFIRMED)
------------------------------------------------------------------ */
import { NextResponse } from "next/server";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { db } from "@/database/drizzle";
import {
  appointments,
  chat_events,
  conversations,
  guest_sessions,
  users,
} from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { getIO } from "@/lib/services/sockets/socket-server";
import { notifyWorker } from "@/lib/actions/notifications";

/* ---------- helpers ------------------------------------------------ */
function formatDateSafely(input: Date | string | undefined | null): string {
  const d = input instanceof Date ? input : input ? new Date(input) : null;
  return !d || isNaN(d.getTime())
    ? ""
    : d.toLocaleString("fr-CA", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function hasAvatar(obj: unknown): obj is { profile_image_url: string | null } {
  return typeof obj === "object" && obj !== null && "profile_image_url" in obj;
}

/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const {
      workerId,
      date,
      time,
      userId,
      guestSessionId,
    }: {
      workerId: string;
      date: string;
      time: string;
      userId?: string;
      guestSessionId?: string;
    } = await req.json();

    if (!uuidValidate(workerId) || !date || !time) {
      return NextResponse.json({ error: "params" }, { status: 400 });
    }

    /* ---------- qui réserve ? ----------------------------------- */
    const safeUser =
      userId &&
      (await db.query.users.findFirst({ where: eq(users.id, userId) }))
        ? userId
        : null;
    const createdByWorker = safeUser === workerId;

    /* ---------- guest session ----------------------------------- */
    let guestId = guestSessionId ?? null;
    if (!safeUser && !guestId) {
      const [gs] = await db
        .insert(guest_sessions)
        .values({
          id: uuidv4(),
          full_name: "Invité",
          expires_at: new Date(Date.now() + 86_400_000),
        })
        .returning();
      guestId = gs.id;
    }

    /* ---------- conversation ------------------------------------ */
    const conv =
      (
        await db
          .select()
          .from(conversations)
          .where(
            safeUser
              ? and(
                  eq(conversations.worker_id, workerId),
                  eq(conversations.user_id, safeUser),
                )
              : and(
                  eq(conversations.worker_id, workerId),
                  eq(conversations.guest_session_id, guestId!),
                ),
          )
      )[0] ??
      (
        await db
          .insert(conversations)
          .values({
            id: uuidv4(),
            worker_id: workerId,
            user_id: safeUser,
            guest_session_id: guestId,
          })
          .returning()
      )[0];

    /* ---------- créneau ----------------------------------------- */
    const start = new Date(`${date}T${time}:00`);
    if (isNaN(start.getTime()))
      return NextResponse.json({ error: "date" }, { status: 400 });

    const end = new Date(start.getTime() + 30 * 60_000);
    const aptId = uuidv4();

    const inserted = await db
      .insert(appointments)
      .values({
        id: aptId,
        worker_id: workerId,
        user_id: createdByWorker ? null : safeUser,
        guest_session_id: createdByWorker ? null : guestId,
        start_time: start,
        end_time: end,
        status: createdByWorker ? "CONFIRMED" : "REQUESTED",
        initiator: createdByWorker ? "worker" : safeUser ? "user" : "guest",
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length === 0)
      return NextResponse.json(
        { error: "Créneau déjà réservé" },
        { status: 409 },
      );

    /* ---------- chat_event -------------------------------------- */
    const [evt] = await db
      .insert(chat_events)
      .values({
        id: uuidv4(),
        conversation_id: conv.id,
        kind: createdByWorker
          ? "appointment_confirmed"
          : "appointment_requested",
        appointment_id: aptId,
        sender_id: safeUser ?? guestId ?? undefined,
        start_time: start,
        end_time: end,
        blurb: createdByWorker
          ? "🎉 Rendez-vous confirmé par le worker"
          : "Nouvelle demande de rendez-vous",
        payload: {
          appointmentId: aptId,
          workerId,
          start,
          end,
          status: createdByWorker ? "CONFIRMED" : "REQUESTED",
        },
      })
      .returning();

    /* ---------- sockets ----------------------------------------- */
    const io = getIO();
    if (io) {
      const roomEvents = `conv:${conv.id}`;
      io.of("/chat-events").to(roomEvents).emit("chatEvent", evt);
      io.of("/chat-events").to(roomEvents).emit("new-event", evt);
      io.to(conv.id).emit("chatEvent", evt);
      io.to(conv.id).emit("new-event", evt);
    }

    /* ---------- notification worker (si demande client) --------- */
    if (!createdByWorker) {
      const sender = safeUser
        ? await db.query.users.findFirst({
            where: eq(users.id, safeUser),
            columns: { full_name: true, profile_image_url: true },
          })
        : await db.query.guest_sessions.findFirst({
            where: eq(guest_sessions.id, guestId!),
            columns: { full_name: true },
          });

      const senderName = sender?.full_name ?? "Client";
      const senderAvatar = hasAvatar(sender) ? sender.profile_image_url : null;

      await notifyWorker(workerId, {
        title: "Nouvelle demande de rendez-vous",
        body: `Client : ${formatDateSafely(start)}`,
        link: `/my-appointments`,
        senderName,
        senderAvatar,
      });
    }

    return NextResponse.json(
      { appointmentId: aptId, conversationId: conv.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("[reserve] error →", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
