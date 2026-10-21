CREATE TABLE "name_links" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"linkedById" text,
	"name" text NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "name_links_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "name_links" ADD CONSTRAINT "name_links_linkedById_user_id_fk" FOREIGN KEY ("linkedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "name_links" ADD CONSTRAINT "name_links_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;