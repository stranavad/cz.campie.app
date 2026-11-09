ALTER TABLE "camps" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "photo_file_id" uuid;--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_content_type", ADD CONSTRAINT "files_content_type" CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));