-- ALTER TYPE "public"."appointment_status" ADD VALUE 'ARCHIVED';--> statement-breakpoint
ALTER TABLE "chat_events" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."chat_event_kind";--> statement-breakpoint
CREATE TYPE "public"."chat_event_kind" AS ENUM('appointment_requested', 'appointment_cancelled', 'appointment_confirmed', 'appointment_completed', 'review_requested', 'review_confirmed');--> statement-breakpoint
ALTER TABLE "chat_events" ALTER COLUMN "kind" SET DATA TYPE "public"."chat_event_kind" USING "kind"::"public"."chat_event_kind";