-- Invoice files are accounting documents: the API may add and read them but never change or remove one,
-- not on an admin's request, nor in cleanup or erasure.
REVOKE UPDATE, DELETE, TRUNCATE ON invoice_files FROM campie_app;
