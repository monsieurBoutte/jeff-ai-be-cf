DROP INDEX IF EXISTS "users_auth_user_id_unique";--> statement-breakpoint
ALTER TABLE `feedback` ALTER COLUMN "vector" TO "vector" F32_BLOB(1536) DEFAULT '[]';--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_user_id_unique` ON `users` (`auth_user_id`);