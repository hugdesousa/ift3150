"use server";

import { db } from "@/database/drizzle";
import { guest_sessions } from "@/database/schema";
import { v4 as uuidv4 } from "uuid";

export async function createGuestSession() {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const createdAt = new Date();

  const [session] = await db
    .insert(guest_sessions)
    .values({
      temporary_token: token,
      expires_at: expiresAt,
      created_at: createdAt,
    })
    .returning();

  return session;
}
