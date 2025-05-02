/* =========================================================================
   GET /api/search – recherche + suggestions (Edge Function)
   ========================================================================= */
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { workers } from "@/database/schema";
import { sql } from "drizzle-orm";

export const runtime = "edge"; // ✅ exécution au plus près de l’utilisateur

/* helper normalisation ASCII / minuscule ------------------------------ */
const normalize = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  /* ----------------- paramètres query ------------------------------- */
  const qRaw = searchParams.get("q") ?? "";
  const q = normalize(qRaw);
  const maxPrice = Number(searchParams.get("max") ?? 1000);
  const minRating = Number(searchParams.get("rating") ?? 0);

  if (!q) return NextResponse.json({ workers: [], suggestions: [] });

  /* ----------------- requête principale ----------------------------- */
  const rows = await db
    .select({
      id: workers.id,
      full_name: workers.full_name,
      skill: workers.skill,
      category: workers.category,
      profile_image_url: workers.profile_image_url,
      rating: workers.rating,
      hourly_rate: workers.hourly_rate,
      location: workers.location,
      latitude: workers.latitude,
      longitude: workers.longitude,
    })
    .from(workers)
    .where(
      sql`
      unaccent(${workers.skill}) ILIKE ${q + "%"}        -- recherche préfixe
      AND coalesce(${workers.hourly_rate},0) <= ${maxPrice}
      AND coalesce(${workers.rating},0)    >= ${minRating}
    `,
    )
    .limit(60);

  /* ----------------- suggestions (top 5 skills distincts) ----------- */
  const suggestions = [...new Set(rows.map((r) => r.skill))].slice(0, 5);

  return NextResponse.json({ workers: rows, suggestions });
}
