CREATE TABLE `account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3) DEFAULT (now()),
	`image` varchar(255),
	`hashedPassword` varchar(255),
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verificationToken_identifier_token` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
CREATE TABLE `prayers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` text,
	`isAnonymous` boolean DEFAULT false,
	`content` text NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`prayerNames` json NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
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
	`scheduleId` text NOT NULL,
	`title` text NOT NULL,
	`date` datetime NOT NULL,
	`speaker` text NOT NULL,
	`bibleVerse` text NOT NULL,
	`summary` text NOT NULL,
	`contributors` json NOT NULL,
	CONSTRAINT `takeaways_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text,
	`done` int,
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
