ALTER TABLE "schedules" ADD COLUMN "generated" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "published" boolean DEFAULT true NOT NULL;