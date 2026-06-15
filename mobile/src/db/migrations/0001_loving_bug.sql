CREATE TABLE `user_calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`school_name` text,
	`school_id` text,
	`last_updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	`visible` integer DEFAULT true NOT NULL
);
