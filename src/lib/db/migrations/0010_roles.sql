CREATE TABLE "role_changes" (
	"changedById" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"fromRole" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"toRole" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text USING "role"::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "takeaways" ADD COLUMN "authorId" text;--> statement-breakpoint
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_changedById_user_id_fk" FOREIGN KEY ("changedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeaways" ADD CONSTRAINT "takeaways_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_single_owner" ON "user" USING btree ("role") WHERE "user"."role" = 'owner';--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("user"."role" in ('owner', 'mita', 'writer', 'member', 'admin'));--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
