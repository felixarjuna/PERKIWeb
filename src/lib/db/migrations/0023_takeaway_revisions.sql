CREATE TABLE "takeaway_revisions" (
	"authorId" text,
	"contributors" json NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"decidedAt" timestamp with time zone,
	"decidedById" text,
	"id" serial PRIMARY KEY NOT NULL,
	"keypoints" text NOT NULL,
	"previousKeypoints" text,
	"previousTldr" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"takeawayId" integer NOT NULL,
	"tldr" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "takeaway_revisions_status_check" CHECK ("takeaway_revisions"."status" in ('draft', 'in_review', 'published', 'discarded'))
);
--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD COLUMN "revisionId" integer;--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD COLUMN "revisionId" integer;--> statement-breakpoint
ALTER TABLE "takeaway_revisions" ADD CONSTRAINT "takeaway_revisions_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_revisions" ADD CONSTRAINT "takeaway_revisions_decidedById_user_id_fk" FOREIGN KEY ("decidedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_revisions" ADD CONSTRAINT "takeaway_revisions_takeawayId_takeaways_id_fk" FOREIGN KEY ("takeawayId") REFERENCES "public"."takeaways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "takeaway_revisions_takeaway_idx" ON "takeaway_revisions" USING btree ("takeawayId");--> statement-breakpoint
CREATE UNIQUE INDEX "takeaway_revisions_open" ON "takeaway_revisions" USING btree ("takeawayId") WHERE "takeaway_revisions"."status" in ('draft', 'in_review');--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD CONSTRAINT "takeaway_comments_revisionId_takeaway_revisions_id_fk" FOREIGN KEY ("revisionId") REFERENCES "public"."takeaway_revisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD CONSTRAINT "takeaway_suggestions_revisionId_takeaway_revisions_id_fk" FOREIGN KEY ("revisionId") REFERENCES "public"."takeaway_revisions"("id") ON DELETE set null ON UPDATE no action;