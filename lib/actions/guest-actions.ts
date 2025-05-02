// lib/actions/guest-actions.ts
"use server";
import { db } from "@/database/drizzle";
import { guest_sessions } from "@/database/schema";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

export async function createGuestSession() {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

  await db.insert(guest_sessions).values({
    id: uuidv4(),
    temporary_token: token,
    expires_at: expiresAt,
  });

  (await cookies()).set("guest_token", token, {
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { token };
}
