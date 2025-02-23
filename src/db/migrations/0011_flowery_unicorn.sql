DROP INDEX IF EXISTS "settings_user_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "users_auth_user_id_unique";--> statement-breakpoint
ALTER TABLE `settings` ALTER COLUMN "lat" TO "lat" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_id_unique` ON `settings` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_user_id_unique` ON `users` (`auth_user_id`);--> statement-breakpoint
ALTER TABLE `settings` ALTER COLUMN "lon" TO "lon" integer;