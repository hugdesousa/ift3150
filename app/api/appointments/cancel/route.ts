/* ------------------------------------------------------------------
   POST /api/appointments/cancel
   – Annule un rendez-vous, crée un chat_event et notifie l’autre partie
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
import { getIO } from "@/lib/services/sockets/socket-server";
import {
  notifyWorker,
  notifyUser,
  notifyGuest,
} from "@/lib/actions/notifications";
import { auth } from "@/auth";
import { cookies } from "next/headers";

/* ---------- helpers ------------------------------------------------ */
const fmt = (d: Date) =>
  d.toLocaleString("fr-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function hasAvatar(o: unknown): o is { profile_image_url: string | null } {
  return typeof o === "object" && o !== null && "profile_image_url" in o;
}

/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    /* ----------- payload (lu 1×) -------------------------------- */
    const { appointmentId, cancellerId } = (await req.json()) as {
      appointmentId: string;
      cancellerId?: string;
    };
    if (!appointmentId)
      return NextResponse.json({ error: "id" }, { status: 400 });

    /* ----------- qui annule ?  (déduction si manquant) ---------- */
    let actorId: string | undefined =
      cancellerId && cancellerId.trim() ? cancellerId : undefined;

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

    /* ----------- RDV + conversation ----------------------------- */
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

    /* ----------- MAJ statut RDV --------------------------------- */
    await db
      .update(appointments)
      .set({ status: "CANCELLED", cancelled_at: new Date() })
      .where(eq(appointments.id, appointmentId));

    /* ----------- chat_event ------------------------------------- */
    const [ev] = await db
      .insert(chat_events)
      .values({
        id: uuidv4(),
        conversation_id: conv.id,
        kind: "appointment_cancelled",
        appointment_id: appointmentId,
        sender_id: actorId,
        blurb: "Rendez-vous annulé ❌",
        created_at: new Date(),
        payload: {
          appointmentId,
          workerId: apt.worker_id,
          start: apt.start_time,
          end: apt.end_time,
          status: "CANCELLED",
        },
      })
      .returning();

    /* ----------- sockets (2 namespaces) ------------------------- */
    const io = getIO();
    const room = `conv:${conv.id}`;
    if (io) {
      io.of("/chat-events").to(room).emit("chatEvent", ev);
      io.of("/chat-events").to(room).emit("new-event", ev);
      io.to(conv.id).emit("chatEvent", ev);
      io.to(conv.id).emit("new-event", ev);
    }

    /* ----------- notifications ---------------------------------- */
    const cancelledByWorker = actorId === apt.worker_id;

    const sender = cancelledByWorker
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
      title: "Rendez-vous annulé",
      body: `Le RDV du ${fmt(apt.start_time)} a été annulé`,
      link: "/my-appointments",
      senderName: sender?.full_name ?? "Utilisateur",
      senderAvatar: hasAvatar(sender) ? sender.profile_image_url : null,
    };

    if (cancelledByWorker) {
      if (apt.user_id) await notifyUser(apt.user_id, base);
      else if (apt.guest_session_id)
        await notifyGuest(apt.guest_session_id, base);
    } else {
      await notifyWorker(apt.worker_id, base);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[appointments/cancel]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
