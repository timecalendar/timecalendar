CREATE TABLE `calendar_events` (
	`uid` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`color` text NOT NULL,
	`group_color` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`exported_at` text NOT NULL,
	`location` text,
	`description` text,
	`all_day` integer NOT NULL,
	`teachers` text NOT NULL,
	`tags` text NOT NULL,
	`fields` text,
	`type` text NOT NULL,
	`user_calendar_id` text NOT NULL
);
