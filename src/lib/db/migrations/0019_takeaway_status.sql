ALTER TABLE "takeaways" ADD COLUMN "publishedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "takeaways" ADD COLUMN "publishedById" text;--> statement-breakpoint
ALTER TABLE "takeaways" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "takeaways" ADD CONSTRAINT "takeaways_publishedById_user_id_fk" FOREIGN KEY ("publishedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaways" ADD CONSTRAINT "takeaways_status_check" CHECK ("takeaways"."status" in ('draft', 'in_review', 'published'));--> statement-breakpoint
-- Existing takeaways were public from the day they were written.
UPDATE "takeaways" SET "publishedAt" = "createdAt" WHERE "status" = 'published' AND "publishedAt" IS NULL;--> statement-breakpoint
