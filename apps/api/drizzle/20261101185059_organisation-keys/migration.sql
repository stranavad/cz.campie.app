CREATE TABLE "organisation_keys" (
	"organisation_id" uuid PRIMARY KEY,
	"wrapped_key" bytea NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organisation_keys" ADD CONSTRAINT "organisation_keys_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;