/* =========================================================================
   /app/api/auth/updateProfile/route.ts
   ========================================================================= */
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users, workers } from "@/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const {
      userId,
      fullName,
      email,
      password,
      profileImageUrl,

      category,
      hourlyRate,
      description,
      location,
      latitude,
      longitude,
      skill, // CSV
      availability, // { weekly: […] }
    } = await req.json();

    /* ---------- USERS ---------- */
    const userUpd: Partial<typeof users.$inferInsert> = {
      full_name: fullName,
      email,
      profile_image_url: profileImageUrl,
    };
    if (password?.trim()) {
      userUpd.password_hash = await bcrypt.hash(password, 10);
    }
    await db.update(users).set(userUpd).where(eq(users.id, userId));

    /* ---------- WORKERS ---------- */
    if (category) {
      // ≈ uniquement si worker
      const workerUpd: typeof workers.$inferInsert = {
        id: userId,
        full_name: fullName,
        profile_image_url: profileImageUrl,
        category,
        skill: skill?.split(",")[0] ?? category,
        description,
        hourly_rate: hourlyRate,
        location,
        latitude,
        longitude,
        availability: availability, // déjà objet JSON
      };

      await db
        .insert(workers)
        .values(workerUpd)
        .onConflictDoUpdate({ target: workers.id, set: workerUpd });
    }

    /* NOTE : on laisse le front décider où aller. */
    return NextResponse.json({ success: true, redirect: "/" });
  } catch (err) {
    console.error("updateProfile error →", err);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du profil" },
      { status: 500 },
    );
  }
}
