-- An Organisation's id is a UUIDv7 generated when it signed up, so it holds the signup time to the
-- millisecond.
UPDATE organisations SET created_at = uuid_extract_timestamp(id) WHERE created_at IS NULL;
--> statement-breakpoint
-- Mail so far was one running total per Organisation, with no day. It is kept whole on the Organisation's
-- signup day, the earliest it can have been sent, so the totals stay and the last days count no more than they had.
UPDATE mail_statistics
SET day = (organisations.created_at AT TIME ZONE 'Europe/Prague')::date
FROM organisations
WHERE organisations.id = mail_statistics.organisation_id AND mail_statistics.day IS NULL;
