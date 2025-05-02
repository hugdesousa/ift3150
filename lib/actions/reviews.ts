// =============================================================
// lib/actions/reviews.ts
// =============================================================
"use server";

import { z } from "zod";
import { db } from "@/database/drizzle";
import {
  reviews,
  workers,
  appointments,
  chat_events,
  conversations,
} from "@/database/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { cookies } from "next/headers";

const payload = z.object({
  appointmentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
});

export async function createReview(raw: unknown) {
  const { appointmentId, rating, comment } = payload.parse(raw);

  /* Qui est l’auteur ? */
  const session = await auth();
  const guestId = (await cookies()).get("guest_token")?.value ?? null;
  const userId = session?.user?.id ?? null;

  /* 1) récupérer l’appointment + vérifier appartenance */
  const conditions = [eq(appointments.id, appointmentId)];

  if (userId) {
    conditions.push(eq(appointments.user_id, userId));
  } else if (guestId) {
    conditions.push(eq(appointments.guest_session_id, guestId));
  } else {
    throw new Error("Utilisateur non authentifié");
  }

  const [apt] = await db
    .select({
      status: appointments.status,
      workerId: appointments.worker_id,
    })
    .from(appointments)
    .where(and(...conditions)) //  ← plus de CASE, plus de paramètre « unknown »
    .limit(1);

  if (!apt) throw new Error("Accès refusé");
  if (apt.status !== "COMPLETED")
    throw new Error("Le travail n’est pas terminé");

  /* 2) création de l’avis (reste inchangé) */
  const [newReview] = await db
    .insert(reviews)
    .values({
      appointment_id: appointmentId,
      worker_id: apt.workerId,
      user_id: userId,
      guest_session_id: guestId,
      rating,
      comment,
    })
    .returning();

  await db
    .update(workers)
    .set({
      rating: sql<number>`(
        SELECT AVG(r.rating)::INTEGER FROM reviews r WHERE r.worker_id = ${apt.workerId}
      )`,
    })
    .where(eq(workers.id, apt.workerId));

  await db.insert(chat_events).values({
    conversation_id: sql`(
      SELECT id FROM conversations
      WHERE worker_id = ${apt.workerId}
        AND (user_id = ${userId} OR guest_session_id = ${guestId})
      LIMIT 1
    )`,
    kind: "review",
    review_id: newReview.id,
  });

  return newReview;
}
