CREATE TYPE "upload_status" AS ENUM('pending', 'approved', 'returned');--> statement-breakpoint
CREATE TABLE "document_uploads" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"file_id" uuid,
	"status" "upload_status" DEFAULT 'pending'::"upload_status" NOT NULL,
	"note" text,
	"uploaded_by_email" text,
	"uploaded_by_admin_id" uuid,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_uploads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "document_uploads_participant_id_idx" ON "document_uploads" ("participant_id","document_type_id");--> statement-breakpoint
CREATE INDEX "document_uploads_document_type_id_idx" ON "document_uploads" ("document_type_id");--> statement-breakpoint
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_participants_fkey" FOREIGN KEY ("organisation_id","participant_id") REFERENCES "participants"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_uploads" ADD CONSTRAINT "document_uploads_document_types_fkey" FOREIGN KEY ("organisation_id","document_type_id") REFERENCES "document_types"("organisation_id","id") ON DELETE RESTRICT;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "document_uploads" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);