-- Due dates used to be read from the Turnus as it is now; each Registration keeps them from here on. Fix
-- the existing ones from the same terms they were read from until now: the Prague date of submission plus
-- the Turnus's deposit days, never after its balance due date unless submitted after it.
UPDATE registrations
SET
  balance_due_date = turnusy.balance_due_date,
  deposit_due_date = CASE
    WHEN turnusy.balance_due_date IS NOT NULL
      AND (registrations.submitted_at AT TIME ZONE 'Europe/Prague')::date <= turnusy.balance_due_date
      THEN LEAST(
        (registrations.submitted_at AT TIME ZONE 'Europe/Prague')::date + turnusy.deposit_due_days,
        turnusy.balance_due_date
      )
    ELSE (registrations.submitted_at AT TIME ZONE 'Europe/Prague')::date + turnusy.deposit_due_days
  END
FROM turnusy
WHERE turnusy.organisation_id = registrations.organisation_id AND turnusy.id = registrations.turnus_id;
--> statement-breakpoint
-- Payments exports started before they took dates exported the whole ledger.
UPDATE participant_exports SET paid_from = '2000-01-01', paid_to = '2099-12-31' WHERE kind = 'payments';
