CREATE TABLE "operators" (
	"admin_id" uuid PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE "platform_audit_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_kind" "audit_actor_kind" NOT NULL,
	"actor_identity" text,
	"ip_address" inet,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"changes" jsonb
);
--> statement-breakpoint
CREATE TABLE "totp_credentials" (
	"admin_id" uuid PRIMARY KEY,
	"secret" bytea NOT NULL,
	"confirmed_at" timestamp with time zone,
	"last_used_step" bigint
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD COLUMN "second_factor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "operators" ADD CONSTRAINT "operators_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "totp_credentials" ADD CONSTRAINT "totp_credentials_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE;