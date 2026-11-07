-- A signature is evidence: the API may add and read signatures and attach the signed PDF once generated,
-- but never change anything else of one, nor remove one.
REVOKE UPDATE, DELETE, TRUNCATE ON consent_signatures FROM campie_app;
GRANT UPDATE (file_id) ON consent_signatures TO campie_app;
