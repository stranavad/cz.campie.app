-- A published registration form version is what guardians signed up under: the API may add and read
-- versions but never change or remove one.
REVOKE UPDATE, DELETE, TRUNCATE ON registration_form_versions FROM campie_app;
