// =============================================================
// app/(root)/my-appointments/page.tsx
// =============================================================
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  appointments,
  workers,
  reviews,
  conversations,
} from "@/database/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MyAppointmentsPage() {
  const session = await auth();
  const isWorker = session?.user?.role === "HELPR";
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_token")?.value ?? null;
  const userId = session?.user?.id ?? null;

  if (!userId && !guestId) {
    return <p className="p-6">Aucun rendez-vous trouvé.</p>;
  }

  const baseFilter = isWorker
    ? eq(appointments.worker_id, userId!)
    : userId
      ? eq(appointments.user_id, userId)
      : eq(appointments.guest_session_id, guestId!);

  /* exclut les ARCHIVED sans passer par un bind param */
  const notArchived = sql`appointments.status <> 'ARCHIVED'::appointment_status`;

  const rows = await db
    .select({
      id: appointments.id,
      start: appointments.start_time,
      end: appointments.end_time,
      status: appointments.status,

      workerId: workers.id,
      workerName: workers.full_name,
      workerSkill: workers.skill,
      rate: workers.hourly_rate,
      avatar: workers.profile_image_url,
      initiator: appointments.initiator,
      conversationId: conversations.id,

      rating: sql<number | null>`(
                                           SELECT r.rating FROM ${reviews} r
                                           WHERE r.appointment_id = ${appointments.id} LIMIT 1
                                       )`.as("rating"),

      reviewId: sql<string | null>`(
                                             SELECT r.id FROM ${reviews} r
                                             WHERE r.appointment_id = ${appointments.id} LIMIT 1
                                         )`.as("review_id"),
    })
    .from(appointments)
    .innerJoin(workers, eq(appointments.worker_id, workers.id))
    .leftJoin(conversations, eq(appointments.id, conversations.id))
    .where(and(baseFilter, notArchived))
    .orderBy(appointments.start_time);

  const MyAppointmentsClient = (
    await import("../../../components/appointment/MyAppointmentsClient")
  ).default;
  return <MyAppointmentsClient rows={rows} isWorker={isWorker} />;
}
