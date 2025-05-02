import { cookies } from "next/headers";
import { db } from "@/database/drizzle";
import { guest_sessions } from "@/database/schema";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";

export async function ensureGuestSession(): Promise<string> {
  const store = await cookies();
  const token = store.get("guest_token")?.value;

  if (token) {
    const ok = await db.query.guest_sessions.findFirst({
      where: eq(guest_sessions.id, token),
    });
    if (ok) return token;
  }
  console.log("Nouveau guest via ensureGuestSession");
  // rien ➡ crée une session invité + cookie
  const id = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  await db.insert(guest_sessions).values({
    id,
    full_name: "Invité",
    created_at: new Date(),
    expires_at: expires,
  });

  store.set("guest_token", id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 3600,
  });

  return id;
}
