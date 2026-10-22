CREATE TABLE "takeaway_comments" (
	"authorId" text,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"quote" text,
	"resolvedAt" timestamp with time zone,
	"resolvedById" text,
	"takeawayId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD CONSTRAINT "takeaway_comments_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD CONSTRAINT "takeaway_comments_resolvedById_user_id_fk" FOREIGN KEY ("resolvedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaway_comments" ADD CONSTRAINT "takeaway_comments_takeawayId_takeaways_id_fk" FOREIGN KEY ("takeawayId") REFERENCES "public"."takeaways"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "takeaway_comments_takeaway_idx" ON "takeaway_comments" USING btree ("takeawayId");