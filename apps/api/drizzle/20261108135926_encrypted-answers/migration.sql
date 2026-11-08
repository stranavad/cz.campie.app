ALTER TABLE "participant_exports" ADD COLUMN "include_health" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "encrypted_answers" bytea;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "encrypted_answers" bytea;