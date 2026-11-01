CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"admin_id" uuid NOT NULL,
	"token_hash" bytea NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "guardian_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" bytea NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guardian_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	CONSTRAINT "memberships_organisation_id_admin_id_unique" UNIQUE("organisation_id","admin_id")
);
--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "subdomain" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_subdomain_key" UNIQUE("subdomain");--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guardian_sessions" ADD CONSTRAINT "guardian_sessions_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "guardian_sessions" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);