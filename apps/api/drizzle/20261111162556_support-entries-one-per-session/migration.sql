-- Entries become visits, at most one open per session: keep each session's latest entry, so the next
-- migration's unique index can hold. Dropped entries only ask the operator to enter again.
DELETE FROM support_entries AS older
USING support_entries AS newer
WHERE older.session_id = newer.session_id
  AND (older.entered_at, older.grant_id) < (newer.entered_at, newer.grant_id);
