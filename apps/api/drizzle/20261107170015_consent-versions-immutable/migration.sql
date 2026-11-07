-- A published Consent version is what guardians signed, and the PDF fingerprints it copies are its proof:
-- the API may add and read both but never change or remove one.
REVOKE UPDATE, DELETE, TRUNCATE ON consent_versions FROM campie_app;
REVOKE UPDATE, DELETE, TRUNCATE ON consent_files FROM campie_app;
