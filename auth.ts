// ift3150/auth.ts
export const runtime = "nodejs";
// Force Node runtime si vous voulez cookies() sync

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const userRow = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        if (!userRow?.password_hash) return null;

        const isValid = await compare(
          credentials.password,
          userRow.password_hash,
        );
        if (!isValid) return null;

        return {
          id: userRow.id,
          name: userRow.full_name,
          email: userRow.email,
          role: userRow.role ?? "USER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...token.user,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Export named "auth()" => SSR
export async function auth() {
  return getServerSession(authOptions);
}
