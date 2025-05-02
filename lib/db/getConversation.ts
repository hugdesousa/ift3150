import { conversations, messages, chat_events } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq, asc, inArray } from "drizzle-orm";

const EVENT_KINDS = [
  "appointment_requested",
  "appointment_confirmed",
  "appointment_completed",
  "appointment_cancelled",
  "appointment_archived",
] as const;

export async function getConversation(convId: string) {
  return db.query.conversations.findFirst({
    where: eq(conversations.id, convId),
    with: {
      worker: true,
      user: true,
      guestSession: true,
      messages: { orderBy: [asc(messages.created_at)] },
      /* chat_events exposé grâce aux relations Drizzle */
      chatEvents: {
        where: inArray(chat_events.kind, EVENT_KINDS),
        orderBy: [asc(chat_events.created_at)],
      },
    },
  });
}
