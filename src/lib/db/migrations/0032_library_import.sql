ALTER TABLE "library_books" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "library_books" ADD COLUMN "format" text DEFAULT 'physical' NOT NULL;--> statement-breakpoint
ALTER TABLE "library_books" ADD COLUMN "publisher" text;--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_format_check" CHECK ("library_books"."format" in ('physical', 'ebook'));