CREATE TABLE "payment_gateway_accounts" (
	"organisation_id" uuid PRIMARY KEY,
	"merchant_id" text NOT NULL,
	"secret" bytea NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_gateway_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_transaction_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_gateway_transaction_id_key" ON "payments" ("organisation_id","gateway_transaction_id") WHERE "gateway_transaction_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_gateway_accounts" ADD CONSTRAINT "payment_gateway_accounts_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_transaction" CHECK (("source" = 'gateway') = ("gateway_transaction_id" IS NOT NULL));--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "payment_gateway_accounts" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);