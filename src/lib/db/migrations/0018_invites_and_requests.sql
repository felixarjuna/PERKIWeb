CREATE TABLE "access_requests" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"decidedAt" timestamp with time zone,
	"decidedById" text,
	"id" serial PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "access_requests_role_check" CHECK ("access_requests"."role" in ('writer')),
	CONSTRAINT "access_requests_status_check" CHECK ("access_requests"."status" in ('pending', 'approved', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "role_invites" (
	"acceptedAt" timestamp with time zone,
	"acceptedUserId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"invitedById" text,
	"revokedAt" timestamp with time zone,
	"role" text NOT NULL,
	CONSTRAINT "role_invites_role_check" CHECK ("role_invites"."role" in ('mita', 'writer', 'member'))
);
--> statement-breakpoint
ALTER TABLE "role_changes" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_decidedById_user_id_fk" FOREIGN KEY ("decidedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_invites" ADD CONSTRAINT "role_invites_acceptedUserId_user_id_fk" FOREIGN KEY ("acceptedUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_invites" ADD CONSTRAINT "role_invites_invitedById_user_id_fk" FOREIGN KEY ("invitedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "access_requests_open_user" ON "access_requests" USING btree ("userId") WHERE "access_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "role_invites_open_email" ON "role_invites" USING btree ("email") WHERE "role_invites"."acceptedAt" is null and "role_invites"."revokedAt" is null;