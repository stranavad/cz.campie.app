CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions" ("admin_id");--> statement-breakpoint
CREATE INDEX "audit_entries_organisation_id_occurred_at_idx" ON "audit_entries" ("organisation_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "guardian_login_links_unused_idx" ON "guardian_login_links" ("organisation_id","email") WHERE "used_at" IS NULL;