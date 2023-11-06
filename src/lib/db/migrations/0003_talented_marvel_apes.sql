ALTER TABLE `takeaways` RENAME COLUMN `summary` TO `keypoints`;--> statement-breakpoint
ALTER TABLE `takeaways` MODIFY COLUMN `scheduleId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `takeaways` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `takeaways` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `takeaways` DROP COLUMN `speaker`;--> statement-breakpoint
ALTER TABLE `takeaways` DROP COLUMN `bibleVerse`;