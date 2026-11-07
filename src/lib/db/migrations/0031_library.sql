CREATE TABLE "library_books" (
	"acceptedAt" timestamp with time zone,
	"author" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdById" text,
	"description" text,
	"id" serial PRIMARY KEY NOT NULL,
	"language" text,
	"ownerId" text,
	"status" text DEFAULT 'available' NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "library_books_status_check" CHECK ("library_books"."status" in ('offered', 'available', 'borrowed', 'reserved', 'withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "library_events" (
	"actorId" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"bookId" integer NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"loanId" integer,
	"subjectId" text,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_loans" (
	"bookId" integer NOT NULL,
	"borrowedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"dueOn" date NOT NULL,
	"extensions" integer DEFAULT 0 NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"note" text,
	"returnedAt" timestamp with time zone,
	"returnedById" text,
	"userId" text NOT NULL,
	CONSTRAINT "library_loans_extensions_check" CHECK ("library_loans"."extensions" >= 0)
);
--> statement-breakpoint
CREATE TABLE "library_reservations" (
	"bookId" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresOn" date,
	"id" serial PRIMARY KEY NOT NULL,
	"readyAt" timestamp with time zone,
	"status" text DEFAULT 'waiting' NOT NULL,
	"userId" text NOT NULL,
	CONSTRAINT "library_reservations_status_check" CHECK ("library_reservations"."status" in ('waiting', 'ready', 'fulfilled', 'expired', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_createdById_user_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_events" ADD CONSTRAINT "library_events_actorId_user_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_events" ADD CONSTRAINT "library_events_bookId_library_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."library_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_events" ADD CONSTRAINT "library_events_loanId_library_loans_id_fk" FOREIGN KEY ("loanId") REFERENCES "public"."library_loans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_events" ADD CONSTRAINT "library_events_subjectId_user_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_bookId_library_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."library_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_returnedById_user_id_fk" FOREIGN KEY ("returnedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_bookId_library_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."library_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_books_owner" ON "library_books" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "library_events_book" ON "library_events" USING btree ("bookId","at");--> statement-breakpoint
CREATE INDEX "library_loans_book" ON "library_loans" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "library_loans_user" ON "library_loans" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "library_loans_open_book" ON "library_loans" USING btree ("bookId") WHERE "library_loans"."returnedAt" is null;--> statement-breakpoint
CREATE INDEX "library_reservations_book" ON "library_reservations" USING btree ("bookId");--> statement-breakpoint
CREATE INDEX "library_reservations_user" ON "library_reservations" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "library_reservations_open_member" ON "library_reservations" USING btree ("bookId","userId") WHERE "library_reservations"."status" in ('waiting', 'ready');