// next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      role?: "USER" | "ADMIN" | "HELPR" | null;
      image?: string | null;
      name?: string | null;
    };
    guestSession?: {
      id: string;
      full_name?: string;
      temporary_token?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      email?: string | null;
      role?: "USER" | "ADMIN" | "HELPR" | null;
      image?: string | null;
      name?: string | null;
    };
    guestSession?: {
      id: string;
      full_name?: string;
      temporary_token?: string;
    };
  }
}
