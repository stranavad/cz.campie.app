-- The role the API connects as. It is created without a login: provisioning gives it one, with a
-- password that never enters the repository. Without BYPASSRLS and owning no table, it is always
-- subject to row-level security.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'campie_app') THEN
    CREATE ROLE campie_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO campie_app;
--> statement-breakpoint
-- Every table the migrating role creates from here on is readable and writable by the API within what
-- its policies admit; a table that needs less revokes it in its own migration.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO campie_app;
