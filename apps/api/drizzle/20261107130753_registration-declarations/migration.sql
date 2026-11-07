CREATE TABLE "registration_form_files" (
	"organisation_id" uuid,
	"camp_id" uuid NOT NULL,
	"file_id" uuid,
	"uploaded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "registration_form_files_pkey" PRIMARY KEY("organisation_id","file_id")
);
--> statement-breakpoint
ALTER TABLE "registration_form_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "registration_form_versions" ADD COLUMN "declarations" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "registration_forms" ADD COLUMN "declarations" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX "registration_form_files_camp_id_idx" ON "registration_form_files" ("camp_id");--> statement-breakpoint
ALTER TABLE "registration_form_files" ADD CONSTRAINT "registration_form_files_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registration_form_files" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);