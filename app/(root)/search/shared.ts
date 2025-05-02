/* =========================================================================
   app/(root)/search/shared.ts — helpers & types (no "use server")
   ========================================================================= */
import { workers } from "@/database/schema";

export type Worker = typeof workers.$inferSelect;

/* ---------------- helpers géographiques ---------------- */
const toRad = (d: number) => (d * Math.PI) / 180;

export const distanceKm = (
  la1: number,
  lo1: number,
  la2: number,
  lo2: number,
) => {
  const R = 6371;
  const dLat = toRad(la2 - la1);
  const dLon = toRad(lo2 - lo1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
