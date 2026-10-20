CREATE TYPE "public"."user_role" AS ENUM('member', 'admin');--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "authorId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;