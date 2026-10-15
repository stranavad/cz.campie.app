# 64 - Feedback and problem reports

Status: ready-for-agent
Stage: 1b
Episode: E9 Trust
Blocked by: 21
Stories: 8, 9, 89

## What to build

Admins send feedback or a problem report from any admin page; it arrives in the operator console with the Organisation, user and page attached. Guardians get a separate 'technical problem' link in the portal and public pages that reaches the operator with the Organisation and page attached, distinct from the camp's own contact shown for questions about the camp. The operator is notified by email of new reports.

## Acceptance criteria

- [ ] An admin report stores Organisation, user, page URL and text, and appears in the console.
- [ ] A guardian technical report stores Organisation and page and does not expose the guardian's family data to the operator beyond what they typed.
- [ ] The portal shows the Camp's contact for questions and the technical link separately.
- [ ] Report endpoints are rate limited.

## Notes

- Spec sections: User stories 8, 9, 89.
- The console sees only what the report contains; no participant data access without a support grant.
