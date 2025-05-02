import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { messages } from "@/database/schema";
import { and, eq, lt, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const convId = req.nextUrl.searchParams.get("conv")!;
  const before = req.nextUrl.searchParams.get("before"); // id du plus ancien déjà affiché

  const cond = before
    ? and(eq(messages.conversation_id, convId), lt(messages.id, before))
    : eq(messages.conversation_id, convId);

  const rows = await db
    .select()
    .from(messages)
    .where(cond)
    .orderBy(desc(messages.created_at))
    .limit(10);

  return NextResponse.json(rows.reverse()); // renvoie ordre chronologique
}
