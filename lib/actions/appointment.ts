//lib/actions/appointment.ts

"use server";

import { db } from "@/database/drizzle";
import { workers, appointments } from "@/database/schema";
import { eq } from "drizzle-orm";
import dayjs from "dayjs";

interface AppointmentParams {
  userId: string;
  workerId: string;
}

export const takeAppointment = async (params: AppointmentParams) => {
  const { userId, workerId } = params;

  try {
    // Récupère les créneaux disponibles pour le travailleur
    const worker = await db
      .select({ availableSlots: workers.availability })
      .from(workers)
      .where(eq(workers.id, workerId))
      .limit(1);

    if (!worker.length || worker[0].availability <= 0) {
      return {
        success: false,
        error: "Worker is not available for appointment",
      };
    }

    // Définir la date programmée du rendez‑vous (par exemple, 7 jours après la réservation)
    const scheduledDate = dayjs().add(7, "day").toDate().toDateString();

    // Insère un rendez‑vous dans la table appointments
    const record = await db.insert(appointments).values({
      userId,
      workerId,
      scheduledDate,
      status: "SCHEDULED", // Assure-toi que cet enum est défini dans ta table appointments
    });

    // Décrémente le nombre de créneaux disponibles pour le travailleur
    await db
      .update(workers)
      .set({ availability: worker[0].availability - 1 })
      .where(eq(workers.id, workerId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error: "An error occurred while booking the appointment",
    };
  }
};
