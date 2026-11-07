CREATE TABLE "card_payments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"transaction_id" text NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "card_payments_transaction_id_key" ON "card_payments" ("organisation_id","transaction_id");--> statement-breakpoint
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "card_payments" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);