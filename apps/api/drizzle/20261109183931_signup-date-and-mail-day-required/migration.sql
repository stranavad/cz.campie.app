ALTER TABLE "mail_statistics" DROP CONSTRAINT "mail_statistics_pkey";--> statement-breakpoint
ALTER TABLE "mail_statistics" ADD CONSTRAINT "mail_statistics_pkey" PRIMARY KEY("organisation_id","day");--> statement-breakpoint
ALTER TABLE "organisations" ALTER COLUMN "created_at" SET NOT NULL;