CREATE TABLE "totp_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"admin_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN "totp_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "totp_recovery_codes_admin_id_idx" ON "totp_recovery_codes" ("admin_id");--> statement-breakpoint
ALTER TABLE "totp_recovery_codes" ADD CONSTRAINT "totp_recovery_codes_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;