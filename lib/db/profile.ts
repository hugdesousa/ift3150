// lib/actions/profile.ts (exemple)
"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function updateProfileAction({
  userId,
  fullName,
  profileImageUrl, // supposons que vous transformiez le fichier en URL
}: {
  userId: string;
  fullName: string;
  profileImageUrl?: string;
}) {
  try {
    await db
      .update(users)
      .set({ fullName, profileImage: profileImageUrl })
      .where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Error updating profile", error);
    return { success: false, error: "Erreur lors de la mise à jour du profil" };
  }
}
