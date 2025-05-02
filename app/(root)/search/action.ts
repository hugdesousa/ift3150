/* =========================================================================
   app/(root)/search/actions.ts — server-action
   ========================================================================= */
"use server";

import { db } from "@/database/drizzle";
import { workers } from "@/database/schema";
import { sql } from "drizzle-orm";
import levenshtein from "fast-levenshtein";
import { Filters } from "@/lib/utils/filters";
import { Worker, distanceKm } from "./shared";

/* helpers internes ------------------------------------------------------ */
const normalize = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const SKILL_UNACC = sql.raw(`lower(unaccent(${workers.skill.name}))`);
const FIRST_NAME = sql.raw(
  `lower(unaccent(split_part(${workers.full_name.name}, ' ', 1)))`,
);
const prefixWhere = (t: string) =>
  sql`(${SKILL_UNACC} ILIKE ${t + "%"} OR ${FIRST_NAME} ILIKE ${t + "%"})`;

/* action principale ----------------------------------------------------- */
export async function runSearch(
  term: string,
  f: Filters,
  userCoords?: { lat: number; lon: number },
): Promise<Worker[]> {
  const q = normalize(term);
  if (!q) return [];

  /* pass 1 : préfixe ---------------------------------------------------- */
  let rows: Worker[] = await db
    .select()
    .from(workers)
    .where(prefixWhere(q))
    .limit(200);

  /* pass 2 : pg_trgm (si installée) ------------------------------------ */
  if (!rows.length) {
    try {
      rows = await db
        .select()
        .from(workers)
        .where(
          sql`
                (similarity(${workers.skill}, ${q}) > 0.1
                  OR similarity(${workers.full_name}, ${q}) > 0.1)
              `,
        )
        .orderBy(
          sql`
                greatest(similarity(${workers.skill}, ${q}),
                similarity(${workers.full_name}, ${q})) DESC
              `,
        )
        .limit(100);
    } catch {
      /* extension absente */
    }
  }

  /* pass 3 : Levenshtein fallback -------------------------------------- */
  if (!rows.length) {
    const many = (await db.select().from(workers).limit(1500)) as Worker[];
    rows = many
      .map((w) => ({
        ...w,
        score: Math.min(
          levenshtein.get(normalize(w.skill), q),
          levenshtein.get(normalize(w.full_name.split(" ")[0]), q),
        ),
      }))
      .filter((w) => w.score <= 3)
      .sort((a, b) => a.score - b.score)
      .slice(0, 250);
  }

  /* filtres prix + note ------------------------------------------------- */
  rows = rows.filter(
    (w) =>
      (f.minPrice ? (w.hourly_rate ?? 0) >= f.minPrice : true) &&
      (f.maxPrice < 1000 ? (w.hourly_rate ?? 0) <= f.maxPrice : true) &&
      (f.rating ? (w.rating ?? 0) >= f.rating : true),
  );

  /* filtre distance ----------------------------------------------------- */
  if (f.useLocation && userCoords) {
    rows = rows.filter(
      (w) =>
        w.latitude != null &&
        w.longitude != null &&
        distanceKm(userCoords.lat, userCoords.lon, w.latitude, w.longitude) <=
          f.radius,
    );
  }

  return rows.slice(0, 60);
}
