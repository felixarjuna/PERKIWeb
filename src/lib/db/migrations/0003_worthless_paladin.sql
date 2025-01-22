CREATE TABLE IF NOT EXISTS "userInfo" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"address" text,
	"phoneNumber" text,
	"church" timestamp,
	"location" text,
	"major" text,
	"bio" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userInfo" ADD CONSTRAINT "userInfo_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
