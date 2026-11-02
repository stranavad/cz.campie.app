CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"registrations" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL,
	"camp_settings" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL,
	"health" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL,
	"oddily" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL,
	"vedouci" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL,
	"token_hash" bytea UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "invitations_organisation_id_email_unique" UNIQUE("organisation_id","email")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;