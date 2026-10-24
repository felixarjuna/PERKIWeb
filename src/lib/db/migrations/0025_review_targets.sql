ALTER TABLE "takeaway_comments" ADD COLUMN "target" text DEFAULT 'notes' NOT NULL;--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD COLUMN "target" text DEFAULT 'notes' NOT NULL;--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD CONSTRAINT "takeaway_comments_target_check" CHECK ("takeaway_comments"."target" in ('notes', 'tldr'));--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD CONSTRAINT "takeaway_suggestions_target_check" CHECK ("takeaway_suggestions"."target" in ('notes', 'tldr'));