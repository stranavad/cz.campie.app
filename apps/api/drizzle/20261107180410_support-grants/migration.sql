CREATE TABLE "support_grants" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"granted_by_admin_id" uuid NOT NULL,
	"allow_writes" boolean NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "support_grants_organisation_id_idx" ON "support_grants" ("organisation_id","expires_at");--> statement-breakpoint
ALTER TABLE "support_grants" ADD CONSTRAINT "support_grants_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;