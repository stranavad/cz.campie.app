CREATE TABLE "registration_access_emails" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "registration_access_emails_registration_id_email_key" UNIQUE("registration_id","email"),
	CONSTRAINT "registration_access_emails_email" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
ALTER TABLE "registration_access_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "registration_access_emails_organisation_id_email_idx" ON "registration_access_emails" ("organisation_id","email");--> statement-breakpoint
ALTER TABLE "registration_access_emails" ADD CONSTRAINT "registration_access_emails_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registration_access_emails" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);