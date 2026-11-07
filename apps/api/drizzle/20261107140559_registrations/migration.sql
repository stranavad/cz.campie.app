CREATE TYPE "participant_status" AS ENUM('registered', 'cancelled');--> statement-breakpoint
CREATE TYPE "payment_choice" AS ENUM('full', 'deposit');--> statement-breakpoint
CREATE TYPE "price_line_kind" AS ENUM('base_price', 'early_bird_price', 'paid_extra', 'claimed_discount', 'sibling_discount', 'discount_code', 'zero_floor');--> statement-breakpoint
CREATE TABLE "declaration_answers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"declaration_id" uuid NOT NULL,
	"accepted" boolean NOT NULL,
	"answered_at" timestamp with time zone NOT NULL,
	"ip_address" inet,
	CONSTRAINT "declaration_answers_registration_id_declaration_id_key" UNIQUE("registration_id","declaration_id")
);
--> statement-breakpoint
ALTER TABLE "declaration_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birth_date" date NOT NULL,
	"status" "participant_status" DEFAULT 'registered'::"participant_status" NOT NULL,
	"answers" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "participants_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "participants_registration_id_position_key" UNIQUE("registration_id","position"),
	CONSTRAINT "participants_position" CHECK ("position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "price_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" "price_line_kind" NOT NULL,
	"participant_id" uuid,
	"label" text,
	"amount" integer NOT NULL,
	CONSTRAINT "price_lines_registration_id_position_key" UNIQUE("registration_id","position"),
	CONSTRAINT "price_lines_position" CHECK ("position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "price_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "registration_guardians" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	CONSTRAINT "registration_guardians_registration_id_position_key" UNIQUE("registration_id","position"),
	CONSTRAINT "registration_guardians_position" CHECK ("position" IN (1, 2))
);
--> statement-breakpoint
ALTER TABLE "registration_guardians" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"turnus_id" uuid NOT NULL,
	"form_version_id" uuid NOT NULL,
	"variable_symbol" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"payment_choice" "payment_choice" NOT NULL,
	"deposit_total" integer,
	"answers" jsonb DEFAULT '{}' NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "registrations_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "registrations_organisation_id_variable_symbol_key" UNIQUE("organisation_id","variable_symbol"),
	CONSTRAINT "registrations_organisation_id_idempotency_key_key" UNIQUE("organisation_id","idempotency_key"),
	CONSTRAINT "registrations_variable_symbol" CHECK ("variable_symbol" ~ '^[0-9]{8}$'),
	CONSTRAINT "registrations_deposit_total" CHECK (coalesce("deposit_total", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount_code_uses" ADD COLUMN "registration_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "discount_code_uses" ADD CONSTRAINT "discount_code_uses_registration_id_key" UNIQUE("registration_id");--> statement-breakpoint
CREATE INDEX "price_lines_participant_id_idx" ON "price_lines" ("participant_id");--> statement-breakpoint
CREATE INDEX "registrations_turnus_id_idx" ON "registrations" ("turnus_id");--> statement-breakpoint
ALTER TABLE "declaration_answers" ADD CONSTRAINT "declaration_answers_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discount_code_uses" ADD CONSTRAINT "discount_code_uses_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id");--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "price_lines" ADD CONSTRAINT "price_lines_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "price_lines" ADD CONSTRAINT "price_lines_participants_fkey" FOREIGN KEY ("organisation_id","participant_id") REFERENCES "participants"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registration_guardians" ADD CONSTRAINT "registration_guardians_registrations_fkey" FOREIGN KEY ("organisation_id","registration_id") REFERENCES "registrations"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_turnusy_fkey" FOREIGN KEY ("organisation_id","turnus_id") REFERENCES "turnusy"("organisation_id","id");--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_registration_form_versions_fkey" FOREIGN KEY ("organisation_id","form_version_id") REFERENCES "registration_form_versions"("organisation_id","id");--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "declaration_answers" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "participants" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "price_lines" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registration_guardians" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "registrations" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);