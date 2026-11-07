CREATE TABLE "claimed_discount_verifications" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"field_id" text NOT NULL,
	"option_id" text DEFAULT '' NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	CONSTRAINT "claimed_discount_verifications_answer_key" UNIQUE("participant_id","field_id","option_id")
);
--> statement-breakpoint
ALTER TABLE "claimed_discount_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "audit_entries_target_id_idx" ON "audit_entries" ("target_id");--> statement-breakpoint
ALTER TABLE "claimed_discount_verifications" ADD CONSTRAINT "claimed_discount_verifications_participants_fkey" FOREIGN KEY ("organisation_id","participant_id") REFERENCES "participants"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "claimed_discount_verifications" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);