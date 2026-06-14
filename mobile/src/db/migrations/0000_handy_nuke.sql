CREATE TABLE `personal_events` (
	`uid` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`color` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`exported_at` text NOT NULL,
	`location` text,
	`description` text
);
