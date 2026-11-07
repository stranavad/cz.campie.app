-- The payment ledger and Price adjustments are a Registration's money history: the API may add and read
-- entries but never change or remove one; mistakes are fixed by a Correcting payment or another adjustment.
REVOKE UPDATE, DELETE, TRUNCATE ON payments FROM campie_app;
REVOKE UPDATE, DELETE, TRUNCATE ON price_adjustments FROM campie_app;
