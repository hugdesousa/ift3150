// app/workers/[id]/chat/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { workers, conversations, messages } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";

export default async function StartChatPage({
  params,
}: {
  params: { id: string };
}) {
  // Ici, params.id correspond à l’ID du worker
  const workerId = params.id;
  if (!workerId) {
    redirect("/workers"); // rediriger si aucune ID n'est fournie
  }

  const session = await auth();
  const userId = session?.user?.id || null;

  // Lecture du cookie guest (si vous utilisez des visiteurs non connectés)
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const guestToken = cookieStore.get("guest_token")?.value;

  if (!userId && !guestToken) {
    // Aucune session n’existe, redirection vers sign-in
    redirect("/auth/signin");
  }

  // Rechercher une conversation existante entre l'utilisateur (ou guest) et ce worker
  let conversation;
  if (userId) {
    conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.worker_id, workerId),
        eq(conversations.user_id, userId),
      ),
      with: {
        messages: { orderBy: [desc(messages.created_at)] },
      },
    });
  } else {
    conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.worker_id, workerId),
        eq(conversations.guest_session_id, guestToken!),
      ),
      with: {
        messages: { orderBy: [desc(messages.created_at)] },
      },
    });
  }

  // Si une conversation existe, rediriger vers l'affichage de la conversation
  if (conversation) {
    redirect(`/chat/${conversation.id}`);
  }

  // Sinon, créer une nouvelle conversation pour ce worker
  const [newConversation] = await db
    .insert(conversations)
    .values({
      worker_id: workerId,
      user_id: userId,
      guest_session_id: guestToken || null,
      last_message_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();

  redirect(`/chat/${newConversation.id}`);
}
