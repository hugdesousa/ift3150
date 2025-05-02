/* ------------------------------------------------------------------
   Confirme un RDV  + chat_event  + notification opposée
------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import {
  appointments,
  chat_events,
  conversations,
  workers,
  users,
  guest_sessions,
} from "@/database/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { getIO } from "@/lib/services/sockets/socket-server";
import {
  notifyWorker,
  notifyUser,
  notifyGuest,
  formatDate, // <- nom correct
} from "@/lib/actions/notifications";

/* -------- utilitaire avatar sûr --------------------------------- */
const avatar = (o: unknown): string | null =>
  o && typeof o === "object" && "profile_image_url" in o
    ? ((o as { profile_image_url: string | null }).profile_image_url ?? null)
    : null;

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, confirmerId } = (await req.json()) as {
      appointmentId: string;
      confirmerId?: string;
    };
    if (!appointmentId)
      return NextResponse.json({ error: "id" }, { status: 400 });

    /* ---------- acteur ----------------------------------------- */
    let actorId: string | undefined =
      confirmerId && confirmerId.trim() ? confirmerId : undefined;
    if (!actorId) {
      const session = await auth();
      const guestCookie = (await cookies()).get("guest_token")?.value;
      actorId =
        session?.user?.id ??
        session?.guestSession?.id ??
        guestCookie ??
        undefined;
    }
    if (!actorId) return NextResponse.json({ error: "actor" }, { status: 400 });

    /* ---------- données RDV + conversation --------------------- */
    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
    });
    if (!apt) return NextResponse.json({ error: "NF" }, { status: 404 });

    const conv = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.worker_id, apt.worker_id),
        apt.user_id
          ? eq(conversations.user_id, apt.user_id)
          : eq(conversations.guest_session_id, apt.guest_session_id!),
      ),
    });
    if (!conv) return NextResponse.json({ error: "conv" }, { status: 404 });

    /* ---------- MAJ statut ------------------------------------- */
    await db
      .update(appointments)
      .set({ status: "CONFIRMED", updated_at: new Date() })
      .where(eq(appointments.id, appointmentId));

    /* ---------- chat_event ------------------------------------- */
    const [ev] = await db
      .insert(chat_events)
      .values({
        id: uuidv4(),
        conversation_id: conv.id,
        kind: "appointment_confirmed",
        appointment_id: appointmentId,
        sender_id: actorId,
        blurb: "Rendez-vous confirmé ✔️",
        created_at: new Date(),
        payload: {
          appointmentId,
          workerId: apt.worker_id,
          start: apt.start_time,
          end: apt.end_time,
          status: "CONFIRMED",
        },
      })
      .returning();

    /* ---------- sockets ---------------------------------------- */
    const io = getIO();
    const room = `conv:${conv.id}`;
    if (io) {
      io.of("/chat-events").to(room).emit("chatEvent", ev);
      io.of("/chat-events").to(room).emit("new-event", ev);
      io.to(conv.id).emit("chatEvent", ev);
      io.to(conv.id).emit("new-event", ev);
    }

    /* ---------- notification opposée --------------------------- */
    const byWorker = actorId === apt.worker_id;

    const sender = byWorker
      ? await db.query.workers.findFirst({
          where: eq(workers.id, apt.worker_id),
          columns: { full_name: true, profile_image_url: true },
        })
      : apt.user_id
        ? await db.query.users.findFirst({
            where: eq(users.id, apt.user_id),
            columns: { full_name: true, profile_image_url: true },
          })
        : await db.query.guest_sessions.findFirst({
            where: eq(guest_sessions.id, apt.guest_session_id!),
            columns: { full_name: true },
          });

    const base = {
      title: "Rendez-vous confirmé",
      body: `Confirmé pour le ${formatDate(apt.start_time)}`,
      link: "/my-appointments",
      senderName: sender?.full_name ?? "Utilisateur",
      senderAvatar: avatar(sender),
    };

    if (byWorker) {
      if (apt.user_id) await notifyUser(apt.user_id, base);
      else if (apt.guest_session_id)
        await notifyGuest(apt.guest_session_id, base);
    } else {
      await notifyWorker(apt.worker_id, base);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[appointments/confirm]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
