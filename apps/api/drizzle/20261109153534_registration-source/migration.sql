CREATE TYPE "registration_source" AS ENUM('public', 'admin');--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "source" "registration_source";