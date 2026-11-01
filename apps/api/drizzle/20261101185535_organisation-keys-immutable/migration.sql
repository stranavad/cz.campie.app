-- A data key is never replaced: a stray update would make every value encrypted under it unreadable.
-- The API may still delete one, which destroys the Organisation's encrypted data on purpose.
REVOKE UPDATE ON organisation_keys FROM campie_app;
