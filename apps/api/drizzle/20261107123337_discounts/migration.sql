CREATE TYPE "discount_code_kind" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "sibling_discount_mode" AS ENUM('every_child', 'from_second_child');--> statement-breakpoint
CREATE TABLE "discount_code_uses" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"used_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discount_code_uses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"code" text NOT NULL,
	"kind" "discount_code_kind" NOT NULL,
	"value" integer NOT NULL,
	"usage_limit" integer,
	"expires_on" date,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "discount_codes_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "discount_codes_value" CHECK ("value" >= 1 AND ("kind" = 'fixed' OR "value" <= 100)),
	CONSTRAINT "discount_codes_usage_limit" CHECK ("usage_limit" IS NULL OR "usage_limit" >= 1)
);
--> statement-breakpoint
ALTER TABLE "discount_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "sibling_discount_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "camps" ADD COLUMN "sibling_discount_applies_to" "sibling_discount_mode" DEFAULT 'every_child'::"sibling_discount_mode" NOT NULL;--> statement-breakpoint
CREATE INDEX "discount_code_uses_discount_code_id_idx" ON "discount_code_uses" ("discount_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discount_codes_camp_id_code_key" ON "discount_codes" ("camp_id",lower("code"));--> statement-breakpoint
ALTER TABLE "discount_code_uses" ADD CONSTRAINT "discount_code_uses_discount_codes_fkey" FOREIGN KEY ("organisation_id","discount_code_id") REFERENCES "discount_codes"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "camps" ADD CONSTRAINT "camps_sibling_discount_amount" CHECK ("sibling_discount_amount" >= 0);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "discount_code_uses" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "discount_codes" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);