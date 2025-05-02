/* ------------------------------------------------------------------
   POST /api/appointments/accept
   – « Accepter » (peut être cliqué par le worker **ou** le client)
------------------------------------------------------------------- */
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import {
  appointments,
  chat_events,
  workers,
  users,
  guest_sessions,
} from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { getIO } from "@/lib/services/sockets/socket-server";
import {
  notifyWorker,
  notifyUser,
  notifyGuest,
} from "@/lib/actions/notifications";
import { auth } from "@/auth";
import { cookies } from "next/headers";

/* helpers --------------------------------------------------------- */
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

/* ---------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    /* 0️⃣  payload lu **une** fois */
    const { appointmentId, accepterId } = (await req.json()) as {
      appointmentId: string;
      accepterId?: string; // facultatif : id de celui qui clique
    };
    if (!appointmentId)
      return NextResponse.json({ error: "id" }, { status: 400 });

    /* 1️⃣  qui accepte ? (déduction si manquant) */
    let actorId: string | undefined =
      accepterId && accepterId.trim() ? accepterId : undefined;

    if (!actorId) {
      const session = await auth();
      const guestToken = (await cookies()).get("guest_token")?.value;
      actorId =
        session?.user?.id ??
        session?.guestSession?.id ??
        guestToken ??
        undefined;
    }
    if (!actorId) return NextResponse.json({ error: "actor" }, { status: 400 });

    /* 2️⃣  MAJ RDV  -> CONFIRMED */
    const [apt] = await db
      .update(appointments)
      .set({ status: "CONFIRMED", updated_at: new Date() })
      .where(eq(appointments.id, appointmentId))
      .returning();
    if (!apt) return NextResponse.json({ error: "NF" }, { status: 404 });

    /* 3️⃣  conversation liée */
    const last = await db.query.chat_events.findFirst({
      where: eq(chat_events.appointment_id, appointmentId),
      orderBy: [desc(chat_events.created_at)],
      columns: { conversation_id: true },
    });
    const convId = last?.conversation_id;
    if (!convId) return NextResponse.json({ error: "conv" }, { status: 404 });

    /* 4️⃣  chat_event « confirmed » */
    const evId = uuidv4();
    const payload = {
      appointmentId,
      workerId: apt.worker_id,
      start: apt.start_time,
      end: apt.end_time,
      status: "CONFIRMED",
    };
    const [ev] = await db
      .insert(chat_events)
      .values({
        id: evId,
        conversation_id: convId,
        kind: "appointment_confirmed",
        appointment_id: appointmentId,
        sender_id: actorId, // ← le vrai acteur
        blurb: "Le rendez-vous est confirmé ✔️",
        created_at: new Date(),
        payload,
      })
      .returning();

    /* 5️⃣  sockets (~ useChatRoom & /chat-events) */
    const io = getIO();
    if (io) {
      const room = `conv:${convId}`;
      io.of("/chat-events").to(room).emit("chatEvent", ev);
      io.of("/chat-events").to(room).emit("new-event", ev);
      io.to(convId).emit("chatEvent", ev);
      io.to(convId).emit("new-event", ev);
    }

    /* 6️⃣  notifications */
    const acceptedByWorker = actorId === apt.worker_id;

    const sender = acceptedByWorker
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
      body: `Confirmé pour le ${fmt(apt.start_time)}`,
      link: "/my-appointments",
      senderName: sender?.full_name ?? "Utilisateur",
      senderAvatar: hasAvatar(sender) ? sender.profile_image_url : null,
    };

    if (acceptedByWorker) {
      // worker → client
      if (apt.user_id) await notifyUser(apt.user_id, base);
      else if (apt.guest_session_id)
        await notifyGuest(apt.guest_session_id, base);
    } else {
      // client → worker
      await notifyWorker(apt.worker_id, base);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[appointments/accept]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
