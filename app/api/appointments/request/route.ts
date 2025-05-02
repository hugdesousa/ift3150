/* --------------------------------------------------------------------
   POST /api/appointments/request
   → un worker propose un créneau (status REQUESTED)
------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import {
  appointments,
  conversations,
  chat_events,
  workers,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { getIO } from "@/lib/services/sockets/socket-server";
import { notifyAppointment } from "@/lib/actions/notifications";

export async function POST(req: Request) {
  try {
    /* ---------- payload & validation ---------------------------- */
    const { conversationId, workerId, start, end } = (await req.json()) as {
      conversationId: string;
      workerId: string;
      start: string; // ISO
      end: string; // ISO
    };

    if (!conversationId || !workerId || !start || !end) {
      return NextResponse.json({ error: "params" }, { status: 400 });
    }

    /* ---------- sécurité : appartient bien au worker ------------ */
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      columns: { worker_id: true, user_id: true, guest_session_id: true },
    });
    if (!conv || conv.worker_id !== workerId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    /* ---------- 1. création RDV -------------------------------- */
    const [apt] = await db
      .insert(appointments)
      .values({
        id: uuidv4(),
        worker_id: workerId,
        user_id: conv.user_id,
        guest_session_id: conv.guest_session_id,
        start_time: new Date(start),
        end_time: new Date(end),
        status: "REQUESTED",
        initiator: "worker",
      })
      .returning();

    /* ---------- 2. chat_event ---------------------------------- */
    const [ev] = await db
      .insert(chat_events)
      .values({
        id: uuidv4(),
        conversation_id: conversationId,
        kind: "appointment_requested",
        appointment_id: apt.id,
        sender_id: workerId,
        blurb: "Demande de rendez-vous proposée",
        created_at: new Date(),
        payload: {
          appointmentId: apt.id,
          workerId,
          start: apt.start_time,
          end: apt.end_time,
          status: "REQUESTED",
          initiator: "worker",
        },
      })
      .returning();

    /* ---------- 3. sockets (2 namespaces) ----------------------- */
    const io = getIO();
    const room = `conv:${conversationId}`;
    io?.of("/chat-events").to(room).emit("chatEvent", ev);
    io?.of("/chat-events").to(room).emit("new-event", ev);
    io?.to(conversationId).emit("chatEvent", ev);
    io?.to(conversationId).emit("new-event", ev);

    /* ---------- 4. notification client ------------------------- */
    const worker = await db.query.workers.findFirst({
      where: eq(workers.id, workerId),
      columns: { full_name: true, profile_image_url: true },
    });

    await notifyAppointment.requested(
      conv.user_id,
      conv.guest_session_id,
      { start: apt.start_time },
      {
        name: worker?.full_name ?? "PRO",
        avatar: worker?.profile_image_url ?? null,
      },
    );

    /* ---------- 5. OK ------------------------------------------ */
    return NextResponse.json(ev, { status: 201 });
  } catch (err) {
    console.error("[appointments/request]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
