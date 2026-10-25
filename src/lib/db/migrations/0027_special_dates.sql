ALTER TABLE "schedules" ADD COLUMN "cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "flags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_flags_check" CHECK ("schedules"."flags" <@ array['communion', 'online', 'putzdienst']::text[]);