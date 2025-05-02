/* =========================================================================
   app/(root)/workers/[id]/page.tsx
   ========================================================================= */
import { notFound } from "next/navigation";
import { db } from "@/database/drizzle";
import { workers, reviews, appointments, users } from "@/database/schema";
import { desc, eq, sql } from "drizzle-orm";
import WorkerDetailClient from "../../../../components/worker/WorkerDetailClient";

export const dynamic = "force-dynamic";

type Slot = { dayOfWeek: number; start: string; end: string };
type Availability = { weekly: Slot[]; exceptions: string[] };

export default async function WorkerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  /* --- profil worker ------------------------------------------------ */
  const workerRow = await db.query.workers.findFirst({
    where: eq(workers.id, id),
  });
  if (!workerRow) notFound();

  const availability: Availability =
    typeof workerRow.availability === "string"
      ? JSON.parse(workerRow.availability)
      : (workerRow.availability as Availability);

  const worker = { ...workerRow, availability };

  /* --- reviews ------------------------------------------------------ */
  const rawReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      author: sql<string>`coalesce(${users.full_name}, 'Invité')`.as("author"),
      since: sql<string>`to_char(${reviews.created_at}, 'MM/YY')`.as("since"),
    })
    .from(reviews)
    .innerJoin(appointments, eq(appointments.id, reviews.appointment_id))
    .leftJoin(users, eq(users.id, appointments.user_id))
    .where(eq(reviews.worker_id, id))
    .orderBy(desc(reviews.created_at))
    .limit(30);

  const reviewsClean = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? "",
    author: r.author,
    since: r.since,
  }));

  return <WorkerDetailClient worker={worker} reviews={reviewsClean} />;
}
