/* ------------------------------------------------------------------
   POST /api/notifications/mark-read
   Body: { conversationId: string }
   → marque comme lues toutes les notifs liées à ce chat
------------------------------------------------------------------- */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { cookies } from "next/headers";
import { getIO } from "@/lib/services/sockets/socket-server";

export async function POST(req: Request) {
  const { conversationId } = (await req.json()) as { conversationId?: string };
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId" }, { status: 400 });
  }

  const session = await auth();
  const guestId =
    session?.guestSession?.id ?? (await cookies()).get("guest_token")?.value;

  /* MAJ ---------------------------------------------------------------- */
  const updated = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.read, false),
        eq(notifications.link, `/chat/${conversationId}`),
        session?.user
          ? eq(notifications.receiverId, session.user.id)
          : eq(notifications.guestSessionId, guestId!),
      ),
    )
    .returning({ id: notifications.id });

  const cleared = updated.length;

  /* push realtime → reset badge --------------------------------------- */
  const room = session?.user ? `user:${session.user.id}` : `guest:${guestId}`;
  getIO()?.of("/notifications").to(room).emit("unread:reset");

  return NextResponse.json({ ok: true, cleared });
}
