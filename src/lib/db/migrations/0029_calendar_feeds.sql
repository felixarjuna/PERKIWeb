CREATE TABLE "calendar_feeds" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"token" text NOT NULL,
	"userId" text PRIMARY KEY NOT NULL,
	CONSTRAINT "calendar_feeds_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "calendar_feeds" ADD CONSTRAINT "calendar_feeds_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;