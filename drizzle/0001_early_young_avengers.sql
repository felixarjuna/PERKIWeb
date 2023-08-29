CREATE TABLE `takeaways` (
	`id` integer PRIMARY KEY NOT NULL,
	`takeawayId` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`speaker` text NOT NULL,
	`bibleVerse` text NOT NULL,
	`summary` text NOT NULL,
	`contributors` text DEFAULT 
);
