import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { appointments, reviews } from "@/database/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const { appointmentId, rating, comment, tags } = await req.json();

    if (!appointmentId || !rating)
      return NextResponse.json({ error: "missing fields" }, { status: 400 });

    /* 1️⃣  On récupère le rendez-vous pour connaître le worker
           (et vérifier que le RDV appartient bien au demandeur si besoin) */
    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      columns: {
        id: true,
        worker_id: true,
        user_id: true,
        guest_session_id: true,
      },
    });
    if (!apt)
      return NextResponse.json(
        { error: "appointment not found" },
        { status: 404 },
      );

    /* 2️⃣  Auth user / guest (facultatif mais pratique pour remplir les colonnes) */
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const guestId = session?.guestSession?.id ?? null;

    /* 3️⃣  Insertion du review  */
    const [rev] = await db
      .insert(reviews)
      .values({
        id: uuid(),
        appointment_id: appointmentId,
        worker_id: apt.worker_id, // ✅ plus NULL
        user_id: userId,
        guest_session_id: guestId,
        rating,
        comment,
        tags, // ex : ["Ponctuel", "Pro"]
        created_at: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, reviewId: rev.id });
  } catch (err) {
    console.error("[reviews/create] error →", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
