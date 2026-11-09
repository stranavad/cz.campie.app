-- An invitation's link has always been valid for seven days from when it was emailed, so an existing one was
-- sent seven days before it expires. Who sent it was never recorded and stays unknown.
UPDATE invitations SET sent_at = expires_at - interval '7 days' WHERE sent_at IS NULL;
