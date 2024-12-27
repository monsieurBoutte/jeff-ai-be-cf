CREATE TABLE `refinements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`original_text` text NOT NULL,
	`refined_text` text NOT NULL,
	`vector` F32_BLOB(1536) DEFAULT '[]',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
