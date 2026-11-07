-- A withdrawal is evidence too: the API may add and read withdrawals but never change or remove one.
REVOKE UPDATE, DELETE, TRUNCATE ON consent_withdrawals FROM campie_app;
