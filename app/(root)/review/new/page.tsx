/* app/(root)/review/new/page.tsx
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
import { notFound } from "next/navigation";
import { db } from "@/database/drizzle";
import { appointments, workers } from "@/database/schema";
import { eq } from "drizzle-orm";
import ReviewPage from "./ReviewPage"; // ⬅️ composant client

export default async function Page({
  searchParams,
}: {
  searchParams: { appointmentId?: string };
}) {
  /* — 1. lecture AVANT le moindre await — */
  const searchParam = await searchParams;
  const aptId = searchParam.appointmentId;
  if (!aptId) notFound();

  /* — 2. maintenant les appels async — */
  const [row] = await db
    .select({
      id: appointments.id,
      start: appointments.start_time, // 👈 on récupère la date

      workerId: workers.id,
      workerName: workers.full_name,
      avatar: workers.profile_image_url,
    })
    .from(appointments)
    .innerJoin(workers, eq(appointments.worker_id, workers.id))
    .where(eq(appointments.id, aptId))
    .limit(1);

  if (!row) notFound();

  /* — 3. on passe uniquement ce qu’il faut au client — */
  return (
    <ReviewPage
      appointmentId={row.id}
      start={row.start} // 👈 on la passe
      worker={{
        id: row.workerId,
        name: row.workerName,
        avatar: row.avatar,
      }}
    />
  );
}
