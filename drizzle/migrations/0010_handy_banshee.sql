CREATE TABLE "guest_push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_session_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "workers" DROP CONSTRAINT "workers_user_id_unique";--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_worker_id_workers_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_worker_id_workers_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_worker_id_workers_id_fk";
--> statement-breakpoint
ALTER TABLE "worker_skills" DROP CONSTRAINT "worker_skills_worker_id_workers_id_fk";
--> statement-breakpoint
DROP INDEX "workers_user_id_idx";--> statement-breakpoint
ALTER TABLE "workers" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_workers_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" DROP COLUMN "id";