CREATE TABLE `legacy_migration_report_outbox` (
	`report_id` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text,
	`delivered_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `legacy_migration_run` (
	`id` integer PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`report_id` text NOT NULL,
	`attempt_count` integer NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`source_version` integer,
	`source_size_bytes` integer,
	`source_fingerprint` text,
	`sqlite_committed` integer DEFAULT 0 NOT NULL,
	`preference_progress` text DEFAULT '{"version":1,"participants":{}}' NOT NULL,
	`counters_json` text DEFAULT '{}' NOT NULL,
	`error_codes_json` text DEFAULT '[]' NOT NULL,
	`terminal_outcome` text,
	CONSTRAINT "legacy_migration_singleton" CHECK("legacy_migration_run"."id" = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legacy_migration_run_report_id_unique` ON `legacy_migration_run` (`report_id`);