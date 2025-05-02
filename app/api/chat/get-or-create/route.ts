/* ------------------------------------------------------------------
   POST /api/chat/get-or-create
   Body : { workerId, userId?, guestSessionId? }
   – retourne l’ID de conversation existante ou fraîchement créée
------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/database/drizzle";
import { conversations, guest_sessions, users } from "@/database/schema";
import { and, eq } from "drizzle-orm";

interface Body {
  workerId: string; // ← id de la table `workers`
  userId?: string | null; // ← si connecté
  guestSessionId?: string | null;
}

export async function POST(req: Request) {
  try {
    const { workerId, userId, guestSessionId } = (await req.json()) as Body;

    /* ───────── 1. validation userId (facultatif) ──────────────── */
    let safeUserId: string | null = userId ?? null;
    if (safeUserId) {
      const exists = await db.query.users.findFirst({
        where: eq(users.id, safeUserId),
        columns: { id: true },
      });
      if (!exists) {
        console.warn(
          "[chat/get-or-create] userId fourni mais introuvable ➜ ignoré",
        );
        safeUserId = null;
      }
    }

    /* ───────── 2. guest-session éventuelle ─────────────────────── */
    let guestId = guestSessionId ?? null;
    if (!safeUserId && !guestId) {
      const [gs] = await db
        .insert(guest_sessions)
        .values({
          id: uuidv4(),
          full_name: "Invité",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
        })
        .returning();
      guestId = gs.id;
    }

    /* ───────── 3. conversation EXISTE ? ───────────────────────── */
    let conv = await db.query.conversations.findFirst({
      where: safeUserId
        ? and(
            eq(conversations.worker_id, workerId),
            eq(conversations.user_id, safeUserId),
          )
        : and(
            eq(conversations.worker_id, workerId),
            eq(conversations.guest_session_id, guestId!),
          ),
    });

    /* ───────── 4. sinon on la crée ─────────────────────────────── */
    if (!conv) {
      [conv] = await db
        .insert(conversations)
        .values({
          id: uuidv4(),
          worker_id: workerId,
          user_id: safeUserId,
          guest_session_id: guestId,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
    }

    return NextResponse.json({ conversationId: conv.id }, { status: 201 });
  } catch (err) {
    console.error("[chat/get-or-create] error →", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
