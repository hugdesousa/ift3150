CREATE TYPE "public"."appointment_status" AS ENUM('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."chat_event_kind" AS ENUM('appointment', 'review');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('SENT', 'DELIVERED', 'READ');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'HELPR');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_session_id" uuid,
	"guest_email" varchar(255),
	"guest_phone" varchar(20),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'REQUESTED',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"kind" "chat_event_kind" NOT NULL,
	"appointment_id" uuid,
	"review_id" uuid,
	"blurb" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid,
	"user_id" uuid,
	"guest_session_id" uuid,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) DEFAULT 'Invité',
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sender_type" varchar(10) NOT NULL,
	"sender_id" uuid,
	"guest_session_id" uuid,
	"receiver_id" uuid,
	"status" "message_status" DEFAULT 'SENT',
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_session_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"profile_image_url" text,
	"status" "user_status" DEFAULT 'PENDING',
	"role" "user_role" DEFAULT 'USER',
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "worker_skills" (
	"worker_id" uuid NOT NULL,
	"skill" varchar(255) NOT NULL,
	CONSTRAINT "worker_skills_worker_id_skill_pk" PRIMARY KEY("worker_id","skill")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"user_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"skill" varchar(255) NOT NULL,
	"category" varchar(255) NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"profile_image_url" text NOT NULL,
	"description" text NOT NULL,
	"hourly_rate" integer NOT NULL,
	"location" text,
	"availability" jsonb DEFAULT '{"weekly":[],"exceptions":[]}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_worker_idx" ON "appointments" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "app_user_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_date_idx" ON "appointments" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "chat_evt_conv_idx" ON "chat_events" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "chat_evt_kind_idx" ON "chat_events" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "conv_worker_idx" ON "conversations" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "conv_user_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conv_guest_idx" ON "conversations" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "msg_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "msg_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "msg_receiver_idx" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "msg_guest_idx" ON "messages" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "msg_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rev_worker_idx" ON "reviews" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "rev_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rev_guest_idx" ON "reviews" USING btree ("guest_session_id");--> statement-breakpoint
CREATE INDEX "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "worker_user_id_idx" ON "workers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_idx" ON "workers" USING btree ("skill");