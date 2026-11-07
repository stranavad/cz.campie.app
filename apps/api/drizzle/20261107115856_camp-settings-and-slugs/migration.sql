CREATE TYPE "camp_module" AS ENUM('consents', 'documents', 'generatedDocuments', 'healthRecord', 'campHealthLog', 'oddily', 'vedouci');--> statement-breakpoint
CREATE TABLE "camp_slugs" (
	"organisation_id" uuid,
	"slug" text,
	"camp_id" uuid NOT NULL,
	CONSTRAINT "camp_slugs_pkey" PRIMARY KEY("organisation_id","slug")
);
--> statement-breakpoint
ALTER TABLE "camp_slugs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "modules" "camp_module"[] DEFAULT '{}'::"camp_module"[] NOT NULL;--> statement-breakpoint
ALTER TABLE "camps" ADD CONSTRAINT "camps_organisation_id_id_key" UNIQUE("organisation_id","id");--> statement-breakpoint
ALTER TABLE "camp_slugs" ADD CONSTRAINT "camp_slugs_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "camp_slugs" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
-- Seed: the current slug of every Camp created before slugs were kept, which lookups and slug changes rely on.
INSERT INTO "camp_slugs" ("organisation_id", "slug", "camp_id") SELECT "organisation_id", "slug", "id" FROM "camps";
