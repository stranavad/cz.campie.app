CREATE TABLE "turnusy" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"place" text NOT NULL,
	"capacity" integer NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"closed_manually" boolean DEFAULT false NOT NULL,
	"website_url" text,
	"base_price" integer NOT NULL,
	"early_bird_price" integer,
	"early_bird_last_day" date,
	"deposit" integer,
	"deposit_due_days" integer DEFAULT 14 NOT NULL,
	"balance_due_date" date,
	CONSTRAINT "turnusy_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "turnusy_dates" CHECK ("end_date" >= "start_date"),
	CONSTRAINT "turnusy_capacity" CHECK ("capacity" >= 1),
	CONSTRAINT "turnusy_prices" CHECK ("base_price" >= 0 AND coalesce("early_bird_price", 0) >= 0 AND coalesce("deposit", 1) > 0),
	CONSTRAINT "turnusy_early_bird" CHECK (("early_bird_price" IS NULL) = ("early_bird_last_day" IS NULL)),
	CONSTRAINT "turnusy_ages" CHECK (coalesce("min_age", 0) >= 0 AND coalesce("min_age", 0) <= coalesce("max_age", 99)),
	CONSTRAINT "turnusy_window" CHECK ("closes_at" IS NULL OR "opens_at" IS NULL OR "closes_at" > "opens_at"),
	CONSTRAINT "turnusy_deposit_due_days" CHECK ("deposit_due_days" >= 1)
);
--> statement-breakpoint
ALTER TABLE "turnusy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "turnusy_camp_id_start_date_idx" ON "turnusy" ("camp_id","start_date");--> statement-breakpoint
ALTER TABLE "turnusy" ADD CONSTRAINT "turnusy_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "turnusy" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);