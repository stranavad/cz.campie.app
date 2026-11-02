-- An Organisation always keeps at least one Owner. Checked at commit, so a transaction may promote one
-- member and demote another in either order; removing the Organisation itself takes its memberships with
-- it. A transaction lock per Organisation serialises the check, so two Owners demoting each other at once
-- cannot both commit: the second waits, and under READ COMMITTED (every unit of work) its next query sees
-- the first one's change. An advisory lock rather than the Organisation's row, which a transaction
-- changing the Organisation and then a membership would deadlock against.
CREATE FUNCTION memberships_keep_an_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT OLD.owner OR (TG_OP = 'UPDATE' AND NEW.owner AND NEW.organisation_id = OLD.organisation_id) THEN
    RETURN NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('memberships_keep_an_owner:' || OLD.organisation_id, 0));

  IF EXISTS (SELECT FROM organisations WHERE id = OLD.organisation_id)
    AND NOT EXISTS (SELECT FROM memberships WHERE organisation_id = OLD.organisation_id AND owner) THEN
    RAISE EXCEPTION 'An Organisation keeps at least one Owner'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'memberships_keep_an_owner';
  END IF;

  RETURN NULL;
END
$$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER memberships_keep_an_owner
  AFTER UPDATE OR DELETE ON memberships
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION memberships_keep_an_owner();
