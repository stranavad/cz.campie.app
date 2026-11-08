-- No admin's email was recorded as proven until now, so every account stays unverified until an invitation
-- or a password reset proves it, except the Platform operator's, which is set up by hand.
UPDATE admins SET email_verified_at = now() WHERE id IN (SELECT admin_id FROM operators);
