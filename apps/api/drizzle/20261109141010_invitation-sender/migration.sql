ALTER TABLE "invitations" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "invited_by_admin_id" uuid;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_admin_id_admins_id_fkey" FOREIGN KEY ("invited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL;