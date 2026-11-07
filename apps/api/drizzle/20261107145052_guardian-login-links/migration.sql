CREATE TABLE "guardian_login_links" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" bytea NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "guardian_login_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guardian_login_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "guardian_login_requests_email" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
ALTER TABLE "guardian_login_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "registration_guardians_organisation_id_email_idx" ON "registration_guardians" ("organisation_id","email");--> statement-breakpoint
ALTER TABLE "guardian_login_links" ADD CONSTRAINT "guardian_login_links_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guardian_login_requests" ADD CONSTRAINT "guardian_login_requests_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registration_guardians" ADD CONSTRAINT "registration_guardians_email" CHECK ("email" = lower("email"));--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "guardian_login_links" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "guardian_login_requests" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);