ALTER TYPE "public"."chat_event_kind" ADD VALUE 'appointment_archived' BEFORE 'review_requested';--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_worker_id_workers_user_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_guest_session_id_guest_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_events" DROP CONSTRAINT "chat_events_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_events" DROP CONSTRAINT "chat_events_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_events" DROP CONSTRAINT "chat_events_review_id_reviews_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_worker_id_workers_user_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_guest_session_id_guest_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_guest_session_id_guest_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_worker_id_workers_user_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_appointment_id_appointments_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_guest_session_id_guest_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "worker_skills" DROP CONSTRAINT "worker_skills_worker_id_workers_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workers" DROP CONSTRAINT "workers_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "msg_conversation_idx";--> statement-breakpoint
DROP INDEX "msg_receiver_idx";--> statement-breakpoint
DROP INDEX "msg_status_idx";--> statement-breakpoint
DROP INDEX "rev_user_idx";--> statement-breakpoint
DROP INDEX "rev_guest_idx";--> statement-breakpoint
DROP INDEX "email_idx";--> statement-breakpoint
DROP INDEX "status_idx";--> statement-breakpoint
DROP INDEX "worker_user_id_idx";--> statement-breakpoint
DROP INDEX "skill_idx";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "initiator" varchar(6) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_events" ADD COLUMN "payload" jsonb;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "msg_conv_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workers_user_id_idx" ON "workers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workers_skill_idx" ON "workers" USING btree ("skill");
/* 🔒 créneau unique pour les statuts actifs */
CREATE UNIQUE INDEX appointments_worker_time_uniq
    ON appointments (worker_id, start_time, end_time)
    WHERE status IN ('REQUESTED','CONFIRMED','COMPLETED');
--> statement-breakpoint

/* 🔒 une seule conversation par pair user/guest ↔︎ worker (optionnel) */
ALTER TABLE conversations
    ADD CONSTRAINT conversations_unique_pair
        UNIQUE (worker_id, COALESCE(user_id::text, guest_session_id::text));
--> statement-breakpoint
