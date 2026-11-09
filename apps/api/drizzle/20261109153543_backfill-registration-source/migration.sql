-- A Registration an admin entered was audited as `registration.create`, one guardians submitted on the
-- public form as `registration.submit`; erasure scrubs who did it but keeps the action. Every Registration
-- has one of the two, so any without an admin's entry came in on the public form.
UPDATE registrations
SET source = CASE
  WHEN EXISTS (
    SELECT FROM audit_entries
    WHERE audit_entries.organisation_id = registrations.organisation_id
      AND audit_entries.target_type = 'registration'
      AND audit_entries.target_id = registrations.id
      AND audit_entries.action = 'registration.create'
  ) THEN 'admin'::registration_source
  ELSE 'public'::registration_source
END
WHERE source IS NULL;
