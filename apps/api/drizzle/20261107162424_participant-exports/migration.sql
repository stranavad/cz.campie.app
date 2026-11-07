CREATE TYPE "export_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TABLE "participant_exports" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"turnus_id" uuid NOT NULL,
	"status" "export_status" DEFAULT 'pending'::"export_status" NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participant_exports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "content_type" SET DATA TYPE text USING "content_type"::text;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_content_type" CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "participant_exports" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
DROP TYPE "file_content_type";