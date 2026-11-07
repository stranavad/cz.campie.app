CREATE TABLE "internal_documents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"uploaded_by_admin_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "internal_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "internal_documents_participant_id_idx" ON "internal_documents" ("participant_id");--> statement-breakpoint
ALTER TABLE "internal_documents" ADD CONSTRAINT "internal_documents_participants_fkey" FOREIGN KEY ("organisation_id","participant_id") REFERENCES "participants"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "internal_documents" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);