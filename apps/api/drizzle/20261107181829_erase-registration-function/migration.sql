-- Erasing a Registration must reach what the API role may otherwise never change: Consent signatures and
-- their withdrawals (deleted), Price adjustments (notes blanked) and audit entries (values, IP addresses and
-- guardian identities scrubbed). This one function does only that, for one Registration of the current
-- Organisation, and is the API role's only way to it.
CREATE FUNCTION erase_registration_protected(p_registration uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_organisation uuid := nullif(current_setting('app.organisation_id', true), '')::uuid;
  v_participants uuid[];
BEGIN
  IF v_organisation IS NULL THEN
    RAISE EXCEPTION 'erase_registration_protected needs a current Organisation';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM registrations WHERE id = p_registration AND organisation_id = v_organisation) THEN
    RAISE EXCEPTION 'erase_registration_protected found no such Registration';
  END IF;

  SELECT coalesce(array_agg(id), '{}') INTO v_participants
  FROM participants WHERE registration_id = p_registration AND organisation_id = v_organisation;

  DELETE FROM consent_withdrawals w USING consent_signatures s
  WHERE w.signature_id = s.id AND s.organisation_id = v_organisation AND s.participant_id = ANY (v_participants);

  DELETE FROM consent_signatures WHERE organisation_id = v_organisation AND participant_id = ANY (v_participants);

  UPDATE price_adjustments SET note = ''
  WHERE organisation_id = v_organisation AND registration_id = p_registration;

  UPDATE audit_entries
  SET changes = NULL,
      encrypted_fields = '{}',
      ip_address = NULL,
      actor_identity = CASE WHEN actor_kind = 'guardian' THEN NULL ELSE actor_identity END
  WHERE organisation_id = v_organisation AND (target_id = p_registration OR target_id = ANY (v_participants));
END;
$$;

REVOKE ALL ON FUNCTION erase_registration_protected(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION erase_registration_protected(uuid) TO campie_app;
