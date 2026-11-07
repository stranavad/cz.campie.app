CREATE TABLE "guardian_email_changes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"email" text NOT NULL,
	"token_hash" bytea NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"previous_email" text,
	CONSTRAINT "guardian_email_changes_email" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
ALTER TABLE "guardian_email_changes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_email_changes_waiting_key" ON "guardian_email_changes" ("registration_id","position") WHERE "confirmed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "guardian_email_changes" ADD CONSTRAINT "guardian_email_changes_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "guardian_email_changes" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);