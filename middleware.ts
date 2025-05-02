// ift3150/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { guest_sessions } from "@/database/schema";
import { and, eq, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// on ne protège que la section chat (et ses sous‑routes)
export const config = {
  matcher: ["/chat/:path*"],
};

/* ------------------------------------------------------------ */
/*  Helpers                                                     */
/* ------------------------------------------------------------ */
async function findValidGuest(id: string) {
  // un petit retry pour les cold‑starts Neon
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await db.query.guest_sessions.findFirst({
        where: and(
          eq(guest_sessions.id, id),
          gt(guest_sessions.expires_at, new Date()),
        ),
      });
    } catch (err) {
      // timeout Neon : on retente immédiatement une 2ᵉ fois
      console.error("[middleware] DB error (attempt", attempt + 1, "):", err);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 150));
    }
  }
  // si les 2 tentatives échouent → on considère que le token n’est pas valide
  return null;
}

/* ------------------------------------------------------------ */
/*  Middleware principal                                        */
/* ------------------------------------------------------------ */
export default async function middleware(req: NextRequest) {
  const guestToken = req.cookies.get("guest_token")?.value;

  /* ---------- 1) Cookie présent ? ---------------------------- */
  if (guestToken) {
    const session = await findValidGuest(guestToken);

    if (session) {
      // ✅ token encore valable → on laisse passer
      return NextResponse.next();
    }

    // ❌ token expiré ou introuvable → on le retire
    const res = NextResponse.next();
    res.cookies.delete({ name: "guest_token", path: "/" });
    return res;
  }

  /* ---------- 2) Pas de cookie → on crée une session invité -- */
  const newId = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000); // +7 jours

  try {
    await db.insert(guest_sessions).values({
      id: newId,
      full_name: "Invité",
      expires_at: expires,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("[middleware] DB insert guest failed:", err);
    // on continue quand même : le cookie side‑car suffira pour cette session
  }

  const res = NextResponse.next();
  res.cookies.set({
    name: "guest_token",
    value: newId,
    httpOnly: true,
    path: "/",
    expires,
  });
  return res;
}
