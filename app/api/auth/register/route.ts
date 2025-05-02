/* =========================================================================
   app/api/auth/register/route.ts
   ========================================================================= */
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/database/drizzle";
import { users, workers } from "@/database/schema";
import { eq } from "drizzle-orm";

/* --- base ImageKit (ex.: https://ik.imagekit.io/xxxx/) --------------- */
const IMG_BASE = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "";

/**
 * POST /api/auth/register
 * Body : {
 *   email, password, fullName,
 *   role?: "HELPR" | "USER",
 *   skill?, category?,
 *   latitude?, longitude?
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      fullName,
      role = "USER",
      skill,
      category,
      latitude,
      longitude,
    } = (await req.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: "USER" | "HELPR";
      skill?: string;
      category?: string;
      latitude?: number | null;
      longitude?: number | null;
    };

    /* -- validations basiques ----------------------------------------- */
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 },
      );
    }

    /* -- email unique -------------------------------------------------- */
    const exists = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (exists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 },
      );
    }

    /* -- création USER ------------------------------------------------- */
    const userId = randomUUID();
    const hashed = await hash(password, 12);
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      full_name: fullName,
      email,
      password_hash: hashed,
      status: "ACTIVE",
      role,
      created_at: now,
      updated_at: now,
    });

    /* -- si rôle HELPR → profil worker -------------------------------- */
    if (role === "HELPR") {
      await db.insert(workers).values({
        id: userId, // FK == users.id
        full_name: fullName,
        skill: skill ?? "",
        category: category ?? "Homme à tout faire",
        rating: 0,
        /* image par défaut via ImageKit */
        profile_image_url: `${IMG_BASE}/workers/avatar/default.svg`,
        description: "",
        hourly_rate: 0,
        location: "Montréal, QC",
        latitude: "45",
        longitude: "-70",
        availability: { weekly: [], exceptions: [] },
        created_at: now,
        updated_at: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
