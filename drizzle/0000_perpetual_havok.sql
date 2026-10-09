CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`ref` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_demo_created` ON `audit` (`demo`,`created_at`);--> statement-breakpoint
CREATE TABLE `credentials` (
	`provider` text PRIMARY KEY NOT NULL,
	`encrypted` text NOT NULL,
	`checked_at` text,
	`status` text DEFAULT 'unverified' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_records_demo_kind` ON `records` (`demo`,`kind`);