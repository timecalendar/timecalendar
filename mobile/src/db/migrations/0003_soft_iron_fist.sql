CREATE TABLE `checklist_items` (
	`uuid` text PRIMARY KEY NOT NULL,
	`event_uid` text NOT NULL,
	`content` text NOT NULL,
	`is_checked` integer NOT NULL,
	`order` integer NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);
