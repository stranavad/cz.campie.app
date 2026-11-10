CREATE TABLE "invoice_files" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"invoice_request_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"uploaded_by_admin_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoice_requests" ADD CONSTRAINT "invoice_requests_organisation_id_id_key" UNIQUE("organisation_id","id");--> statement-breakpoint
CREATE INDEX "invoice_files_invoice_request_id_idx" ON "invoice_files" ("invoice_request_id");--> statement-breakpoint
ALTER TABLE "invoice_files" ADD CONSTRAINT "invoice_files_invoice_requests_fkey" FOREIGN KEY ("organisation_id","invoice_request_id") REFERENCES "invoice_requests"("organisation_id","id");--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "invoice_files" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);