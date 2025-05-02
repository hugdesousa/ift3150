/* ------------------------------------------------------------------
   POST /api/chat/guest-session
   - Si l’utilisateur possède déjà un cookie `guest_token` référencé
     dans la table `guest_sessions`, on le réutilise.
   - Sinon on crée une nouvelle session invité (+ cookie HTTP-only).
------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

import { db } from "@/database/drizzle";
import { guest_sessions } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get("guest_token")?.value;

  /* ---------- 1) session déjà connue ? ------------------------- */
  if (existingToken) {
    const sess = await db.query.guest_sessions.findFirst({
      where: eq(guest_sessions.id, existingToken),
    });
    if (sess) {
      return NextResponse.json({ id: sess.id }); // on renvoie juste l’id
    }
  }

  /* ---------- 2) création d’une nouvelle session --------------- */
  const newId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000); // 7 jours

  await db.insert(guest_sessions).values({
    id: newId,
    full_name: "Invité",
    expires_at: expiresAt,
  });

  /* ---------- 3) pose du cookie                                 */
  cookieStore.set("guest_token", newId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60, // seconds
  });

  /* TODO : prévoir une tâche CRON pour supprimer les sessions
           dont expires_at est dépassé.                            */

  return NextResponse.json({ id: newId }, { status: 201 });
}
