CREATE TYPE "email_type" AS ENUM('registration_confirmation', 'login_link', 'payment_received', 'payment_reminder', 'consent_copy', 'open_items_reminder', 'document_returned', 'cancellation', 'new_registration_notification');--> statement-breakpoint
CREATE TABLE "camp_email_texts" (
	"organisation_id" uuid,
	"camp_id" uuid,
	"type" "email_type",
	"subject" text NOT NULL,
	"text" text NOT NULL,
	"enabled" boolean NOT NULL,
	CONSTRAINT "camp_email_texts_pkey" PRIMARY KEY("organisation_id","camp_id","type")
);
--> statement-breakpoint
ALTER TABLE "camp_email_texts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "notification_emails" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "contact_edit_lock_date" date;--> statement-breakpoint
ALTER TABLE "camp_email_texts" ADD CONSTRAINT "camp_email_texts_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "camp_email_texts" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);