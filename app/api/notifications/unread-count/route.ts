/* ------------------------------------------------------------------
   GET /api/notifications/unread-count
   → nombre de notifications non lues pour l’utilisateur courant
------------------------------------------------------------------- */
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { and, eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const guestId =
    session?.guestSession?.id ??
    (await cookies()).get("guest_token")?.value ??
    null;

  /* non connecté → 0 ------------------------------------------------ */
  if (!session?.user && !guestId) {
    return Response.json({ count: 0 });
  }

  /* count(*) -------------------------------------------------------- */
  const [{ value: unread }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.read, false),
        session?.user
          ? eq(notifications.receiverId, session.user.id)
          : eq(notifications.guestSessionId, guestId!),
      ),
    );

  return Response.json({ count: unread });
}
