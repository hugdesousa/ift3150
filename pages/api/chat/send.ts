/* ────────────────────────────────────────────────────────────────────────────
   POST /api/chat/send
   – insère un message texte, émet Socket.IO, pousse une notification
   ───────────────────────────────────────────────────────────────────────── */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";

import { authOptions } from "@/auth";
import { db } from "@/database/drizzle";
import { conversations, messages, workers } from "@/database/schema";
import { eq } from "drizzle-orm";

import {
  notifyUser,
  notifyWorker,
  notifyGuest,
} from "@/lib/actions/notifications";
import { getIO } from "@/lib/services/sockets/socket-server";

/* ========================================================================== */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end();

  /* ---------- 1. payload ----------------------------------------------- */
  const { content = "", conversationId } = req.body as {
    content?: string;
    conversationId?: string;
  };

  if (!content.trim() || !conversationId) {
    return res.status(400).json({ error: "Missing content or conversationId" });
  }

  /* ---------- 2. session / guest token --------------------------------- */
  const session = await getServerSession(req, res, authOptions);
  const guestId = req.cookies["guest_token"] ?? null;

  let sender_type: "user" | "worker" | "guest";
  let sender_id: string | null = null;
  let guest_session_id: string | null = null;

  if (session?.user?.role === "HELPR") {
    sender_type = "worker";
    sender_id = session.user.id;
  } else if (session?.user) {
    sender_type = "user";
    sender_id = session.user.id;
  } else {
    sender_type = "guest";
    guest_session_id = guestId;
  }

  /* ---------- 3. conversation + ACL ------------------------------------ */
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const allowed =
    (sender_type === "worker" && sender_id === conv.worker_id) ||
    (sender_type === "user" && sender_id === conv.user_id) ||
    (sender_type === "guest" && guest_session_id === conv.guest_session_id);

  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  /* ---------- 4. insert message ---------------------------------------- */
  const [saved] = await db
    .insert(messages)
    .values({
      id: randomUUID(),
      conversation_id: conversationId,
      content: content.trim(),
      sender_type,
      sender_id,
      guest_session_id,
      receiver_id:
        sender_type === "worker"
          ? (conv.user_id ?? conv.guest_session_id!)
          : conv.worker_id,
      status: "SENT",
      created_at: new Date(),
    })
    .returning();

  await db
    .update(conversations)
    .set({ last_message_at: new Date() })
    .where(eq(conversations.id, conversationId));

  /* ---------- 5. broadcast temps-réel ---------------------------------- */
  getIO()?.to(conversationId).emit("newMessage", saved);

  /* ---------- 6. build notification payload --------------------------- */
  const summary = content.length > 60 ? `${content.slice(0, 57)}…` : content;

  const u = session?.user as any; // full_name / profile_image_url éventuels

  /** Résout un avatar absolu (ou `null`) */
  async function resolveAvatar(): Promise<string | null> {
    // 1° worker connecté → requête DB pour obtenir son avatar « canonique »
    if (session?.user?.role === "HELPR") {
      const row = await db.query.workers.findFirst({
        where: eq(workers.id, session.user.id),
        columns: { profile_image_url: true },
      });
      if (row?.profile_image_url) {
        return row.profile_image_url.startsWith("http")
          ? row.profile_image_url
          : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ""}${row.profile_image_url}`;
      }
    }

    // 2° session.portfolio : profile_image_url déjà chargé
    if (u?.profile_image_url) {
      return u.profile_image_url.startsWith("http")
        ? u.profile_image_url
        : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ""}${u.profile_image_url}`;
    }

    // 3° fallback Next-Auth
    return u?.image ?? null;
  }

  const senderName = u?.full_name ?? u?.name ?? "Invité";

  const payload = {
    /* — titre : nom de l’expéditeur — */
    title: senderName,
    /* — body : contenu du message — */
    body: summary,
    /* — lien vers le chat — */
    link: `/chat/${conversationId}`,
    /* — pour Sonner mais aussi pour mobile — */
    senderName,
    senderAvatar: await resolveAvatar(),
  };

  /* ---------- 7. dispatch à la bonne cible ---------------------------- */
  if (sender_type === "worker") {
    if (conv.user_id) await notifyUser(conv.user_id, payload);
    else if (conv.guest_session_id)
      await notifyGuest(conv.guest_session_id, payload);
  } else {
    if (conv.worker_id) await notifyWorker(conv.worker_id, payload);
  }

  return res.status(200).json(saved);
}
