CREATE TYPE "legal_document" AS ENUM('terms', 'data_processing_agreement');--> statement-breakpoint
CREATE TABLE "camps" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "camps_organisation_id_slug_unique" UNIQUE("organisation_id","slug")
);
--> statement-breakpoint
ALTER TABLE "camps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"document" "legal_document" NOT NULL,
	"version" text NOT NULL,
	"accepted_at" timestamp with time zone NOT NULL,
	"accepted_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "owner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "statutory_representative" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "vat_id" text;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "contact_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "contact_phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "billing_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "camps" ADD CONSTRAINT "camps_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_accepted_by_admins_id_fkey" FOREIGN KEY ("accepted_by") REFERENCES "admins"("id");--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "camps" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);