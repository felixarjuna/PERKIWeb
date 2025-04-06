ALTER TABLE "prayers" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prayers" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "takeaways" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "takeaways" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "takeaways" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();