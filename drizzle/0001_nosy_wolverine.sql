CREATE TABLE `recurring_income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`account_id` integer NOT NULL,
	`day_of_month` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_processed` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
