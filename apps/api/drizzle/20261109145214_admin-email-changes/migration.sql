CREATE TABLE "admin_email_changes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"admin_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" bytea NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"previous_email" text,
	CONSTRAINT "admin_email_changes_email" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_email_changes_waiting_key" ON "admin_email_changes" ("admin_id") WHERE "confirmed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "admin_email_changes" ADD CONSTRAINT "admin_email_changes_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;