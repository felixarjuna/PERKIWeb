ALTER TABLE `account` DROP FOREIGN KEY `account_userId_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `id_token` text;--> statement-breakpoint
ALTER TABLE `user` ADD `hashedPassword` varchar(255);