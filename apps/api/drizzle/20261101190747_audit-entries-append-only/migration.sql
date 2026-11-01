-- The audit log is append-only: the API may add and read entries but never change or remove one.
REVOKE UPDATE, DELETE, TRUNCATE ON audit_entries FROM campie_app;
