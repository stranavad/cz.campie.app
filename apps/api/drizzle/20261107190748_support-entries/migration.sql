CREATE TABLE "support_entries" (
	"grant_id" uuid,
	"session_id" uuid,
	"entered_at" timestamp with time zone NOT NULL,
	CONSTRAINT "support_entries_pkey" PRIMARY KEY("grant_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "support_entries" ADD CONSTRAINT "support_entries_grant_id_support_grants_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "support_grants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_entries" ADD CONSTRAINT "support_entries_session_id_admin_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "admin_sessions"("id") ON DELETE CASCADE;