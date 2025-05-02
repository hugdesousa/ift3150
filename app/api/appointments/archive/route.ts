import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { appointments, chat_events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { getIO } from "@/lib/services/sockets/socket-server";

export async function POST(req: Request) {
  try {
    const { appointmentId, conversationId } = (await req.json()) as {
      appointmentId: string;
      conversationId: string | null;
    };

    const [apt] = await db
      .update(appointments)
      .set({ status: "ARCHIVED", updated_at: new Date() })
      .where(eq(appointments.id, appointmentId))
      .returning();
    if (!apt) return NextResponse.json({ error: "NF" }, { status: 404 });

    if (conversationId) {
      const payload = {
        appointmentId,
        workerId: apt.worker_id,
        start: apt.start_time,
        end: apt.end_time,
        status: "ARCHIVED",
      };

      const evId = uuidv4();
      await db.insert(chat_events).values({
        id: evId,
        conversation_id: conversationId,
        kind: "appointment_archived",
        appointment_id: appointmentId,
        sender_id: apt.worker_id,
        blurb: "Rendez-vous archivé 📦",
        created_at: new Date(),
        payload,
      });

      getIO()
        ?.of("/chat-events")
        .to(`conv:${conversationId}`)
        .emit("chatEvent", {
          id: evId,
          conversation_id: conversationId,
          type: "appointment_archived",
          sender_id: apt.worker_id,
          created_at: new Date(),
          payload,
        });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[archive]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
