CREATE TYPE "undeliverable_reason" AS ENUM('bounce', 'complaint');--> statement-breakpoint
CREATE TABLE "mail_statistics" (
	"organisation_id" uuid PRIMARY KEY,
	"sent" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"bounced" integer DEFAULT 0 NOT NULL,
	"complained" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "undeliverable_emails" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"reason" "undeliverable_reason" NOT NULL,
	"marked_at" timestamp with time zone NOT NULL,
	CONSTRAINT "undeliverable_emails_organisation_id_email_key" UNIQUE("organisation_id","email"),
	CONSTRAINT "undeliverable_emails_email" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
ALTER TABLE "undeliverable_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mail_statistics" ADD CONSTRAINT "mail_statistics_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "undeliverable_emails" ADD CONSTRAINT "undeliverable_emails_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "undeliverable_emails" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);