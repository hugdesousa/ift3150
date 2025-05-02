"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

// Connexion utilisateur
export async function loginUser(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    redirect("/"); // Redirection côté serveur
  } catch (error) {
    return { error: "Identifiants invalides" };
  }
}

// Inscription utilisateur
export async function registerUser(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("fullName")?.toString();

  if (!email || !password || !fullName) {
    return { error: "Tous les champs sont requis" };
  }

  try {
    // Vérification de l'existence de l'utilisateur
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "Cet email est déjà utilisé" };
    }

    // Hachage du mot de passe
    const hashedPassword = await hash(password, 12);

    // Création de l'utilisateur
    await db.insert(users).values({
      id: crypto.randomUUID(),
      full_name: fullName,
      email,
      password_hash: hashedPassword,
      status: "ACTIVE",
      role: "USER",
    });

    // Connexion automatique
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    redirect("/"); // Redirection côté serveur
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    return { error: "Erreur lors de l'inscription" };
  }
}
