CREATE TYPE "document_type_kind" AS ENUM('download', 'requirement');--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organisation_id" uuid NOT NULL,
	"camp_id" uuid NOT NULL,
	"kind" "document_type_kind" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"due_date" date,
	"turnus_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "document_types_organisation_id_id_key" UNIQUE("organisation_id","id"),
	CONSTRAINT "document_types_kind_fields" CHECK (("kind" = 'requirement' OR "due_date" IS NULL) AND ("kind" = 'download' OR cardinality("turnus_ids") = 0))
);
--> statement-breakpoint
ALTER TABLE "document_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "document_types_camp_id_idx" ON "document_types" ("camp_id");--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_camps_fkey" FOREIGN KEY ("organisation_id","camp_id") REFERENCES "camps"("organisation_id","id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "organisation_isolation" ON "document_types" AS PERMISSIVE FOR ALL TO "campie_app" USING (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid) WITH CHECK (organisation_id = nullif(current_setting('app.organisation_id', true), '')::uuid);