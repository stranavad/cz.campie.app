ALTER TABLE "participant_exports" ADD COLUMN "paid_from" date;--> statement-breakpoint
ALTER TABLE "participant_exports" ADD COLUMN "paid_to" date;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "deposit_due_date" date;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "balance_due_date" date;--> statement-breakpoint
CREATE INDEX "payments_organisation_id_paid_on_idx" ON "payments" ("organisation_id","paid_on");