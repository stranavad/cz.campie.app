CREATE TABLE "consent_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"signature_id" uuid NOT NULL CONSTRAINT "consent_withdrawals_signature_id_key" UNIQUE,
	"withdrawn_by_email" text NOT NULL,
	"ip_address" text NOT NULL,
	"withdrawn_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_withdrawals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consent_signatures" ADD CONSTRAINT "consent_signatures_organisation_id_id_key" UNIQUE("organisation_id","id");--> statement-breakpoint
ALTER TABLE "consent_withdrawals" ADD CONSTRAINT "consent_withdrawals_consent_signatures_fkey" FOREIGN KEY ("organisation_id","signature_id") REFERENCES "consent_signatures"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "consent_withdrawals" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);