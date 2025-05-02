// app/api/chat/read/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/database/drizzle";
import { messages } from "@/database/schema";
import { and, eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import type { Server } from "socket.io";

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json();

  const session = await auth();
  const isWorker = session?.user?.role === "HELPR";

  // 1) Met à jour read_at
  await db
    .update(messages)
    .set({ read_at: new Date() })
    .where(
      and(
        eq(messages.conversation_id, conversationId),
        isNull(messages.read_at),
        isWorker
          ? or(
              eq(messages.sender_type, "user"),
              eq(messages.sender_type, "guest"),
            )
          : eq(messages.sender_type, "worker"),
      ),
    );

  // 2) Émet l’événement messagesRead
  const io = (globalThis as any).io as Server;
  io?.to(conversationId).emit("messagesRead", { conversationId });

  return NextResponse.json({ ok: true });
}
