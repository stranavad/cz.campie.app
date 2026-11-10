CREATE TYPE "payer" AS ENUM('guardian', 'company');--> statement-breakpoint
ALTER TYPE "camp_module" ADD VALUE 'invoiceRequests';--> statement-breakpoint
CREATE TABLE "invoice_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL CONSTRAINT "invoice_requests_registration_id_key" UNIQUE,
	"company_name" text NOT NULL,
	"ico" text NOT NULL,
	"dic" text,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"postcode" text NOT NULL,
	"email" text,
	"note" text,
	"amount" integer NOT NULL,
	"invoiced_on" date,
	"invoice_number" text,
	CONSTRAINT "invoice_requests_amount" CHECK ("amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "invoice_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payer" "payer" DEFAULT 'guardian'::"payer" NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_payer" CHECK ("source" <> 'gateway' OR "payer" = 'guardian');--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "invoice_requests" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);