CREATE TABLE `adaptive_learners` (
	`user_id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`join_code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classrooms_owner_id_unique` ON `classrooms` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `classrooms_join_code_unique` ON `classrooms` (`join_code`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`user_id` text NOT NULL,
	`alias` text NOT NULL
);
