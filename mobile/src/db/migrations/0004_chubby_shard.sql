CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar_id` text NOT NULL,
	`calendar_name` text NOT NULL,
	`change_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_logs_created_at_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `activity_logs_calendar_id_idx` ON `activity_logs` (`calendar_id`);--> statement-breakpoint
CREATE TABLE `activity_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_read_at` text,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`last_successful_refresh_at` text,
	`older_page_cursor` text,
	`older_page_complete` integer DEFAULT false NOT NULL
);
