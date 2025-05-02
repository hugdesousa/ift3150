import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user || !(await compare(password, user.password_hash))) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 400 },
    );
  }

  /* session NextAuth – Credentials provider */
  const sess = await getServerSession(authOptions); // non obligatoire ici
  return NextResponse.json({ success: true, userId: user.id });
}
