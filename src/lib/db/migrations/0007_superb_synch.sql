ALTER TABLE `account` MODIFY COLUMN `id_token` varchar(255);--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `hashedPassword`;