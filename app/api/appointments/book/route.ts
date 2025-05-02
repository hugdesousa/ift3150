// ift3150/app/api/book/route.ts

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { appointments, conversations, guest_sessions } from "@/database/schema";
import { eq } from "drizzle-orm";

interface BookingRequest {
  workerId: string;
  startTime: string; // ISO string
  time: string;
  userId?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export async function POST(request: Request) {
  try {
    const { workerId, startTime, time, userId, guestEmail, guestPhone } =
      (await request.json()) as BookingRequest;

    // Validate
    if (!workerId || !startTime || !time) {
      return NextResponse.json(
        { error: "Missing booking parameters" },
        { status: 400 },
      );
    }

    let guestSessionId: string | null = null;

    // Si user non connecté, créer une session invité
    if (!userId) {
      const [guestSession] = await db
        .insert(guest_sessions)
        .values({
          id: uuidv4(),
          full_name: guestEmail || guestPhone || "Invité",
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // +1 jour
          created_at: new Date(),
        })
        .returning();
      guestSessionId = guestSession.id;
    }

    // 1. Créer le rendez-vous
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h plus tard

    const [appointment] = await db
      .insert(appointments)
      .values({
        id: uuidv4(),
        worker_id: workerId,
        user_id: userId || null,
        guest_session_id: guestSessionId,
        guest_email: guestEmail || null,
        guest_phone: guestPhone || null,
        start_time: start,
        end_time: end,
        status: "REQUESTED",
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    // 2. Créer la conversation associée
    const [conversation] = await db
      .insert(conversations)
      .values({
        id: uuidv4(),
        worker_id: workerId,
        user_id: userId || null,
        guest_session_id: guestSessionId,
        last_message_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return NextResponse.json({
      appointmentId: appointment.id,
      conversationId: conversation.id,
    });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
