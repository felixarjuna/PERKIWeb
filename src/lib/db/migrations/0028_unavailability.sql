CREATE TABLE "unavailability" (
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"endsOn" date NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"note" text,
	"startsOn" date NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "unavailability_range_check" CHECK ("unavailability"."endsOn" >= "unavailability"."startsOn")
);
--> statement-breakpoint
ALTER TABLE "unavailability" ADD CONSTRAINT "unavailability_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unavailability_user" ON "unavailability" USING btree ("userId");