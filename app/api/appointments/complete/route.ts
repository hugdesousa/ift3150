// app/api/appointments/complete/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { appointments, chat_events } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getIO } from "@/lib/services/sockets/socket-server";
import { notifyAppointment } from "@/lib/actions/notifications";
import { workers } from "@/database/schema";
export async function POST(req: Request) {
  try {
    const { appointmentId, conversationId } = (await req.json()) as {
      appointmentId: string;
      conversationId?: string; // ⇦ facultatif maintenant
    };

    /* 1️⃣  MAJ → COMPLETED ----------------------------------------- */
    const [apt] = await db
      .update(appointments)
      .set({ status: "COMPLETED", updated_at: new Date() })
      .where(eq(appointments.id, appointmentId))
      .returning();
    if (!apt) return NextResponse.json({ error: "NF" }, { status: 404 });

    /* 2️⃣  retrouver la conversation si besoin --------------------- */
    let convId = conversationId;
    if (!convId) {
      const last = await db.query.chat_events.findFirst({
        where: eq(chat_events.appointment_id, appointmentId),
        orderBy: [desc(chat_events.created_at)],
        columns: { conversation_id: true },
      });
      convId = last?.conversation_id;
      if (!convId) return NextResponse.json({ error: "conv" }, { status: 404 });
    }

    /* 3️⃣  chat_event « completed » -------------------------------- */
    const payload = {
      appointmentId,
      workerId: apt.worker_id,
      start: apt.start_time,
      end: apt.end_time,
      status: "COMPLETED",
    };

    const [ev] = await db
      .insert(chat_events)
      .values({
        id: uuidv4(),
        conversation_id: convId,
        kind: "appointment_completed",
        appointment_id: appointmentId,
        sender_id: apt.worker_id,
        blurb: "Rendez-vous terminé ✅",
        created_at: new Date(),
        payload,
      })
      .returning();

    /* 4️⃣  diffusion temps-réel (deux namespaces) ------------------ */
    const io = getIO();
    if (io) {
      const room = `conv:${convId}`;

      io.of("/chat-events").to(room).emit("chatEvent", ev);
      io.of("/chat-events").to(room).emit("new-event", ev); // compat v1

      io.to(convId).emit("chatEvent", ev);
      io.to(convId).emit("new-event", ev);
    }

    const worker = await db.query.workers.findFirst({
      where: eq(workers.id, apt.worker_id),
      columns: { full_name: true, profile_image_url: true },
    });

    await notifyAppointment.completed(
      apt.user_id,
      apt.guest_session_id,
      { start: apt.start_time },
      {
        name: worker?.full_name ?? "PRO",
        avatar: worker?.profile_image_url ?? null,
      },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[complete]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
