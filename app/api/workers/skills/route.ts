// app/api/workers/skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // toujours frais

/* util: supprime accents + minuscule */
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export async function GET(req: NextRequest) {
  const rawCat = req.nextUrl.searchParams.get("category") ?? "";
  if (!rawCat) return NextResponse.json([]);

  // charge le JSON { "Plomberie": [ "Pose", … ], … }
  const file = path.join(process.cwd(), "data", "categories.json");
  const data = JSON.parse(await fs.readFile(file, "utf-8")) as Record<
    string,
    string[]
  >;

  /* ① correspondance exacte (sensible aux accents) */
  let skills = data[rawCat];

  /* ② sinon, cherche en slug insensible aux accents/casse */
  if (!skills) {
    const key = Object.keys(data).find((k) => slugify(k) === slugify(rawCat));
    skills = key ? data[key] : [];
  }

  return NextResponse.json(skills ?? []);
}
