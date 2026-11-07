CREATE TYPE "export_kind" AS ENUM('participants', 'payments');--> statement-breakpoint
CREATE TABLE "export_presets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"name" text NOT NULL,
	"columns" jsonb NOT NULL,
	"created_by_admin_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "export_presets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "export_selections" (
	"organisation_id" uuid,
	"admin_id" uuid,
	"camp_id" uuid,
	"columns" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "export_selections_pkey" PRIMARY KEY("organisation_id","admin_id","camp_id")
);
--> statement-breakpoint
ALTER TABLE "export_selections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "participant_exports" ADD COLUMN "kind" "export_kind" DEFAULT 'participants'::"export_kind" NOT NULL;--> statement-breakpoint
ALTER TABLE "participant_exports" ADD COLUMN "columns" jsonb;--> statement-breakpoint
ALTER TABLE "participant_exports" ALTER COLUMN "turnus_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "export_presets_camp_id_idx" ON "export_presets" ("camp_id");--> statement-breakpoint
ALTER TABLE "export_presets" ADD CONSTRAINT "export_presets_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "export_selections" ADD CONSTRAINT "export_selections_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "participant_exports" ADD CONSTRAINT "participant_exports_turnus" CHECK (("kind" = 'participants') = ("turnus_id" IS NOT NULL));--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "export_presets" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "export_selections" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);