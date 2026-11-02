-- Only the operator command line, connecting as the tables' owner, makes or unmakes the Platform
-- operator: the API reads the flag and cannot change it, whatever a route does.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON operators FROM campie_app;
--> statement-breakpoint
-- The platform's audit log is append-only, like each Organisation's.
REVOKE UPDATE, DELETE, TRUNCATE ON platform_audit_entries FROM campie_app;
