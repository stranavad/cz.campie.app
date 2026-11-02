CREATE TYPE "permission_level" AS ENUM('none', 'read', 'write');--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "registrations" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "camp_settings" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "health" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "oddily" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "vedouci" "permission_level" DEFAULT 'none'::"permission_level" NOT NULL;