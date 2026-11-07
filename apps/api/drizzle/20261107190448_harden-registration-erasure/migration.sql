-- The erasure function, hardened: temporary tables can no longer shadow the real ones (pg_temp is searched
-- last), it acts only on a Registration already marked erased, and it also erases what its guardians' and
-- access emails left beyond the Registration, when no other Registration of the Organisation uses them:
-- their login links, login requests, sessions and undeliverable marks, and the identity, IP address and
-- values of the audit entries they made or that name those marks.
CREATE OR REPLACE FUNCTION erase_registration_protected(p_registration uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE
  v_organisation uuid := nullif(current_setting('app.organisation_id', true), '')::uuid;
  v_participants uuid[];
  v_emails text[];
  v_marks uuid[];
BEGIN
  IF v_organisation IS NULL THEN
    RAISE EXCEPTION 'erase_registration_protected needs a current Organisation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.registrations
    WHERE id = p_registration AND organisation_id = v_organisation AND erased_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'erase_registration_protected found no such Registration marked erased';
  END IF;

  SELECT coalesce(array_agg(id), '{}') INTO v_participants
  FROM public.participants WHERE registration_id = p_registration AND organisation_id = v_organisation;

  -- The addresses only this Registration uses: another, live Registration keeps its traces.
  SELECT coalesce(array_agg(DISTINCT email), '{}') INTO v_emails
  FROM (
    SELECT email FROM public.registration_guardians
    WHERE registration_id = p_registration AND organisation_id = v_organisation
    UNION
    SELECT email FROM public.registration_access_emails
    WHERE registration_id = p_registration AND organisation_id = v_organisation
  ) own
  WHERE NOT EXISTS (
    SELECT 1 FROM public.registration_guardians g JOIN public.registrations r ON r.id = g.registration_id
    WHERE g.organisation_id = v_organisation AND g.email = own.email
      AND r.id <> p_registration AND r.erased_at IS NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM public.registration_access_emails a JOIN public.registrations r ON r.id = a.registration_id
    WHERE a.organisation_id = v_organisation AND a.email = own.email
      AND r.id <> p_registration AND r.erased_at IS NULL
  );

  DELETE FROM public.consent_withdrawals w USING public.consent_signatures s
  WHERE w.signature_id = s.id AND s.organisation_id = v_organisation AND s.participant_id = ANY (v_participants);

  DELETE FROM public.consent_signatures
  WHERE organisation_id = v_organisation AND participant_id = ANY (v_participants);

  UPDATE public.price_adjustments SET note = ''
  WHERE organisation_id = v_organisation AND registration_id = p_registration;

  SELECT coalesce(array_agg(id), '{}') INTO v_marks
  FROM public.undeliverable_emails WHERE organisation_id = v_organisation AND email = ANY (v_emails);

  UPDATE public.audit_entries
  SET changes = NULL,
      encrypted_fields = '{}',
      ip_address = NULL,
      actor_identity = CASE WHEN actor_kind = 'guardian' THEN NULL ELSE actor_identity END
  WHERE organisation_id = v_organisation
    AND (
      target_id = p_registration
      OR target_id = ANY (v_participants)
      OR target_id = ANY (v_marks)
      OR (actor_kind = 'guardian' AND actor_identity = ANY (v_emails))
    );

  DELETE FROM public.undeliverable_emails WHERE organisation_id = v_organisation AND id = ANY (v_marks);
  DELETE FROM public.guardian_login_links WHERE organisation_id = v_organisation AND email = ANY (v_emails);
  DELETE FROM public.guardian_login_requests WHERE organisation_id = v_organisation AND email = ANY (v_emails);
  DELETE FROM public.guardian_sessions WHERE organisation_id = v_organisation AND email = ANY (v_emails);
END;
$$;

REVOKE ALL ON FUNCTION erase_registration_protected(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION erase_registration_protected(uuid) TO campie_app;

-- No role needs temporary tables; without them none can shadow a table a function reads.
DO $$
BEGIN
  EXECUTE format('REVOKE TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
END;
$$;
