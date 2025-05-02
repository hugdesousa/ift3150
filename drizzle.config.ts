// drizzle.config.ts (à la racine du projet)

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./database/schema.ts",
  out: "./drizzle/migrations", // Modifié ce chemin
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
