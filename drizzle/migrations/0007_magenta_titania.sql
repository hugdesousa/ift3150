ALTER TABLE "chat_events" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_events" ADD COLUMN "start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_events" ADD COLUMN "end_time" timestamp with time zone;