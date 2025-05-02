// database/seed.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";
import ImageKit from "imagekit";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import frenchWorkers from "../data/dummyworkers.json";
import { users, workers } from "../database/schema";

/* ------------------------------------------------------------------ */
/* 1.  Connexion base ------------------------------------------------ */
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/* ------------------------------------------------------------------ */
/* 2.  ImageKit ------------------------------------------------------ */
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder = "/workers/profiles",
): Promise<string> => {
  try {
    const { filePath } = await imagekit.upload({ file: url, fileName, folder });
    return filePath; // stocke le path, pas l’URL complète
  } catch (err) {
    console.error("⛔️  Upload failed → fallback to original URL", err);
    return url;
  }
};

/* ------------------------------------------------------------------ */
/* 3.  Seed ---------------------------------------------------------- */
(async () => {
  console.log("🚜  Seeding workers…");

  for (const w of frenchWorkers) {
    try {
      /* a)  user ---------------------------------------------------- */
      const userId = uuidv4();
      const email = `${w.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`;
      const password = await hash(email, 10); // mot de passe générique

      await db.insert(users).values({
        id: userId,
        full_name: w.fullName,
        email,
        password_hash: password,
        profile_image_url: w.profile_image_url,
        status: "ACTIVE",
        role: "HELPR",
        created_at: new Date(),
        updated_at: new Date(),
      });

      /* b)  avatar upload ------------------------------------------ */
      const profileImageUrl = w.profile_image_url?.includes("imagekit.io")
        ? w.profile_image_url
        : await uploadToImageKit(
            w.profile_image_url || "https://via.placeholder.com/300",
            `${w.fullName.replace(/\s+/g, "_")}.jpg`,
          );

      /* c)  worker -------------------------------------------------- */
      await db.insert(workers).values({
        id: userId,
        full_name: w.fullName,
        skill: w.skill,
        category: w.category,
        rating: w.rating ?? 0,
        profile_image_url: profileImageUrl,
        description: w.description,
        hourly_rate: w.hourly_rate,
        availability: w.availability, // {weekly:[…], exceptions:[]}
        created_at: new Date(w.created_at ?? Date.now()),
        updated_at: new Date(w.updated_at ?? Date.now()),
      });

      console.log(`✅  ${w.fullName} importé`);
    } catch (err) {
      console.error(`❌  Échec pour ${w.fullName}`, err);
    }
  }

  console.log("🎉  Seed terminé !");
  process.exit(0);
})();
