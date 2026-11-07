ALTER TABLE "camps" ADD COLUMN "accent_colour" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "logo_file_id" uuid;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "bank_account" text;--> statement-breakpoint
ALTER TABLE "camps" ADD CONSTRAINT "camps_accent_colour_hex" CHECK ("accent_colour" ~ '^#[0-9a-f]{6}$');