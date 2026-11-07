CREATE TABLE "registration_form_versions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"max_participants" integer NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "registration_form_versions_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "registration_form_versions_camp_id_version_key" UNIQUE("camp_id","version"),
	CONSTRAINT "registration_form_versions_version" CHECK ("version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "registration_form_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "registration_forms" (
	"organisation_id" uuid,
	"camp_id" uuid,
	"draft" jsonb NOT NULL,
	"max_participants" integer NOT NULL,
	CONSTRAINT "registration_forms_pkey" PRIMARY KEY("organisation_id","camp_id")
);
--> statement-breakpoint
ALTER TABLE "registration_forms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "registration_form_versions" ADD CONSTRAINT "registration_form_versions_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registration_forms" ADD CONSTRAINT "registration_forms_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registration_form_versions" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registration_forms" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);