PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feature_type` text NOT NULL,
	`feature_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`vector` F32_BLOB(1536),
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_feedback`("id", "user_id", "feature_type", "feature_id", "rating", "comment", "vector", "created_at", "updated_at") SELECT "id", "user_id", "feature_type", "feature_id", "rating", "comment", "vector", "created_at", "updated_at" FROM `feedback`;--> statement-breakpoint
DROP TABLE `feedback`;--> statement-breakpoint
ALTER TABLE `__new_feedback` RENAME TO `feedback`;--> statement-breakpoint
PRAGMA foreign_keys=ON;