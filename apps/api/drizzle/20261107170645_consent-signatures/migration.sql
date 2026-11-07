CREATE TABLE "consent_signatures" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"consent_id" uuid NOT NULL,
	"consent_version_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"signer_name" text NOT NULL,
	"signer_place" text NOT NULL,
	"signer_email" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"signed_at" timestamp with time zone NOT NULL,
	"file_id" uuid
);
--> statement-breakpoint
ALTER TABLE "consent_signatures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "consent_signatures_participant_id_idx" ON "consent_signatures" ("participant_id","consent_id","signed_at");--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_participants_fkey" FOREIGN KEY ("organisation_id","participant_id") REFERENCES "participants"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_consents_fkey" FOREIGN KEY ("organisation_id","consent_id") REFERENCES "consents"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_consent_versions_fkey" FOREIGN KEY ("organisation_id","consent_version_id") REFERENCES "consent_versions"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "consent_signatures" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);