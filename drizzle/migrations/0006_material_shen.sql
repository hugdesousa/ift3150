CREATE TYPE "public"."receiver_type" AS ENUM('guest', 'user', 'worker');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receiver_type" "receiver_type" NOT NULL,
	"receiver_id" uuid,
	"guest_session_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "tags" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "notif_receiver_idx" ON "notifications" USING btree ("receiver_type","receiver_id","guest_session_id");