CREATE TYPE "problem_report_kind" AS ENUM('admin', 'guardian');--> statement-breakpoint
CREATE TABLE "problem_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"kind" "problem_report_kind" NOT NULL,
	"organisation_id" uuid,
	"admin_id" uuid,
	"email" text,
	"page_url" text NOT NULL,
	"text" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_organisation_id_organisations_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE;