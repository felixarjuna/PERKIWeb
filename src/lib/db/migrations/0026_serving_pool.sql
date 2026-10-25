CREATE TABLE "serving_pool" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"pausedUntil" date,
	"pauseNote" text,
	"role" text NOT NULL,
	"scope" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"userId" text NOT NULL,
	CONSTRAINT "serving_pool_role_check" CHECK ("serving_pool"."role" in ('leader', 'liturgist', 'musician', 'multimedia', 'accommodation', 'note_writer', 'publication')),
	CONSTRAINT "serving_pool_scope_check" CHECK ("serving_pool"."scope" in ('both', 'church_service', 'bible_study')),
	CONSTRAINT "serving_pool_status_check" CHECK ("serving_pool"."status" in ('active', 'backup'))
);
--> statement-breakpoint
ALTER TABLE "serving_pool" ADD CONSTRAINT "serving_pool_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "serving_pool_user_role" ON "serving_pool" USING btree ("userId","role");