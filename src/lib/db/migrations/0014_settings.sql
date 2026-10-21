CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedById" text,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updatedById_user_id_fk" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- The sheet the schedule import read until now (it was hardcoded in the old import); change it on /admin/settings.
INSERT INTO "settings" ("key", "value") VALUES ('schedule_sheet_id', '1McH8SoN1ut6CfERNi6BSh45O8vhshfZElDA42FbTZMs');--> statement-breakpoint
