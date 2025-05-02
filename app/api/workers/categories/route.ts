// app/api/workers/categories

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // toujours frais

export async function GET() {
  const file = path.join(process.cwd(), "data", "categories.json");
  const raw = await fs.readFile(file, "utf-8");
  const data = JSON.parse(raw); // { catégorie: [skills] }

  // Retourne [{ category: "Plomberie", skills: [...] }, ...]
  const list = Object.entries<string[]>(data).map(([cat, skills]) => ({
    category: cat,
    skills,
  }));

  return NextResponse.json(list);
}
