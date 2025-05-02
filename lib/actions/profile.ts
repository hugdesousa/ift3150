"use server";
import { db } from "@/database/drizzle";
import { users, workers } from "@/database/schema";
import { eq } from "drizzle-orm";

/* ----------- update users ----------- */
export async function updateUserProfile(
  userId: string,
  data: {
    full_name?: string;
    email?: string;
    profile_image_url?: string;
  },
) {
  await db
    .update(users)
    .set({ ...data, updated_at: new Date() })
    .where(eq(users.id, userId));
}

/* ----------- update workers ----------- */
export async function updateWorkerProfile(
  userId: string, // même id que worker.id
  data: {
    skill?: string;
    category?: string;
    description?: string;
    hourly_rate?: number;
    location?: string;
  },
) {
  await db
    .update(workers)
    .set({ ...data, updated_at: new Date() })
    .where(eq(workers.id, userId));
}
