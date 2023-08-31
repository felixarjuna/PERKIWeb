CREATE TABLE `prayers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text,
	`content` text NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`prayerNames` json NOT NULL,
	CONSTRAINT `prayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` datetime NOT NULL,
	`speaker` text NOT NULL,
	`bibleVerse` text NOT NULL,
	`summary` text NOT NULL,
	`liturgos` text,
	`musician` text,
	`multimedia` text,
	`accommodation` text,
	`cookingGroup` text,
	`cleaningGroup` text NOT NULL,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `takeaways` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`takeawayId` text NOT NULL,
	`title` text NOT NULL,
	`date` datetime NOT NULL,
	`speaker` text NOT NULL,
	`bibleVerse` text NOT NULL,
	`summary` text NOT NULL,
	`contributors` text NOT NULL,
	CONSTRAINT `takeaways_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text,
	`done` int,
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
