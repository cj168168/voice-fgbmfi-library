CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`edition_number` text NOT NULL,
	`title` text NOT NULL,
	`year` integer NOT NULL,
	`cover_key` text NOT NULL,
	`pdf_key` text NOT NULL,
	`pdf_size` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
