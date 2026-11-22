CREATE TABLE `request_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`used` integer NOT NULL,
	`expires_at` integer NOT NULL
);
