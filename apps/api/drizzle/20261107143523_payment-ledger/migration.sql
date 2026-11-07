CREATE TYPE "payment_source" AS ENUM('manual', 'gateway', 'correction');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"source" "payment_source" NOT NULL,
	"amount" integer NOT NULL,
	"paid_on" date NOT NULL,
	"note" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "payments_amount" CHECK (("source" = 'correction' AND "amount" < 0) OR ("source" <> 'correction' AND "amount" > 0))
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "price_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "price_adjustments_amount" CHECK ("amount" <> 0)
);
--> statement-breakpoint
ALTER TABLE "price_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "payments_registration_id_idx" ON "payments" ("registration_id");--> statement-breakpoint
CREATE INDEX "price_adjustments_registration_id_idx" ON "price_adjustments" ("registration_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id");--> statement-breakpoint
ALTER TABLE "price_adjustments" ADD CONSTRAINT "price_adjustments_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id");--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "payments" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "price_adjustments" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);