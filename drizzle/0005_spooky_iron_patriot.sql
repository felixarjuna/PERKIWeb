CREATE TABLE `prayers` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`content` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
