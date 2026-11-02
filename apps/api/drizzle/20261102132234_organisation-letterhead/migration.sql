ALTER TABLE "organisations" ADD COLUMN "legal_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "ico" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "display_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "accent_colour" text DEFAULT '#2b8a4e' NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "logo_file_id" uuid;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_accent_colour_hex" CHECK ("accent_colour" ~ '^#[0-9a-f]{6}$');