ALTER TABLE "support_entries" ADD COLUMN "id" uuid DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "support_entries" ADD COLUMN "left_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "support_entries" DROP CONSTRAINT "support_entries_pkey";--> statement-breakpoint
ALTER TABLE "support_entries" ADD PRIMARY KEY ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_entries_open_session_id_key" ON "support_entries" ("session_id") WHERE "left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "support_entries_grant_id_idx" ON "support_entries" ("grant_id");