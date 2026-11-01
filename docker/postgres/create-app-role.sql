-- Local only, run when the Compose PostgreSQL first creates its data: the application role with a
-- login and a password that is not secret. In a deployment the migration creates the role without a
-- login, and provisioning gives it one with a real password.
CREATE ROLE campie_app LOGIN PASSWORD 'campie_app' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
