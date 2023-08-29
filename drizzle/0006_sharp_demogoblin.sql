CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`speaker` text NOT NULL,
	`bibleVerse` text NOT NULL,
	`summary` text NOT NULL,
	`liturgos` text,
	`musician` text,
	`multimedia` text,
	`accommodation` text,
	`cookingGroup` text,
	`cleaningGroup` text NOT NULL
);
