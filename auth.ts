import NextAuth, { User } from "next-auth";
import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toString()))
          .limit(1);

        if (user.length === 0) return null;

        const isPasswordValid = await compare(
          credentials.password.toString(),
          user[0].password,
        );

        if (!isPasswordValid) return null;

        return {
          id: user[0].id.toString(),
          email: user[0].email,
          name: user[0].fullName,
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in", // Redirigez vers la page de connexion après la déconnexion
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }

      console.log("JWT token: %o", token); // Affichez le token JWT
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        console.log("Session user: %o", session.user); // Affichez l'utilisateur de la session
        console.log("Token: %o", token); // Affichez le token complet

        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }

      return session;
    },
  },
  events: {
    async signOut() {
      console.log("User signed out. Token invalidated."); // Log lors de la déconnexion
      console.log("Session user: %o", CredentialsProvider.name); // Affichez l'utilisateur de la session
    },
  },
});
