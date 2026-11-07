CREATE TABLE "consent_files" (
	"organisation_id" uuid,
	"camp_id" uuid NOT NULL,
	"file_id" uuid,
	"sha256" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consent_files_pkey" PRIMARY KEY("organisation_id","file_id")
);
--> statement-breakpoint
ALTER TABLE "consent_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consent_versions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"consent_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"introduction" text NOT NULL,
	"items" jsonb NOT NULL,
	"withdrawable" boolean NOT NULL,
	"file_id" uuid,
	"file_sha256" text,
	"published_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consent_versions_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "consent_versions_consent_id_version_key" UNIQUE("consent_id","version"),
	CONSTRAINT "consent_versions_version" CHECK ("version" >= 1),
	CONSTRAINT "consent_versions_file" CHECK (("file_id" IS NULL) = ("file_sha256" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "consent_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "consents_organisation_id_id_key" UNIQUE("organisation_id","id")
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "consent_files_camp_id_idx" ON "consent_files" ("camp_id");--> statement-breakpoint
CREATE INDEX "consents_camp_id_idx" ON "consents" ("camp_id");--> statement-breakpoint
ALTER TABLE "consent_files" ADD CONSTRAINT "consent_files_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consent_versions" ADD CONSTRAINT "consent_versions_consents_fkey" FOREIGN KEY ("organisation_id","consent_id") REFERENCES "consents"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "consent_files" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "consent_versions" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "consents" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);