// ift3150/app/api/cancel-appointment/route.ts
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { appointments, workers } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { appointmentId, userId } = await request.json();

    // Vérifie que le rendez-vous appartient à l'utilisateur (optionnel)
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment || appointment.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: "Rendez-vous introuvable ou non autorisé",
      });
    }

    // Annule le rendez-vous en mettant à jour le statut
    await db
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(eq(appointments.id, appointmentId));

    // Optionnel : Incrémente le nombre de créneaux disponibles pour le worker
    const workerId = appointment.workerId;
    const [workerData] = await db
      .select({ availableSlots: workers.availableSlots })
      .from(workers)
      .where(eq(workers.id, workerId))
      .limit(1);

    if (workerData) {
      await db
        .update(workers)
        .set({ availableSlots: workerData.availableSlots + 1 })
        .where(eq(workers.id, workerId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling appointment", error);
    return NextResponse.json({
      success: false,
      error: "Erreur lors de l'annulation du rendez-vous",
    });
  }
}
