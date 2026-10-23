CREATE TABLE "takeaway_suggestions" (
	"authorId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"decidedAt" timestamp with time zone,
	"decidedById" text,
	"id" serial PRIMARY KEY NOT NULL,
	"original" text NOT NULL,
	"replacement" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"takeawayId" integer NOT NULL,
	CONSTRAINT "takeaway_suggestions_status_check" CHECK ("takeaway_suggestions"."status" in ('open', 'accepted', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD CONSTRAINT "takeaway_suggestions_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD CONSTRAINT "takeaway_suggestions_decidedById_user_id_fk" FOREIGN KEY ("decidedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_suggestions" ADD CONSTRAINT "takeaway_suggestions_takeawayId_takeaways_id_fk" FOREIGN KEY ("takeawayId") REFERENCES "public"."takeaways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "takeaway_suggestions_takeaway_idx" ON "takeaway_suggestions" USING btree ("takeawayId");