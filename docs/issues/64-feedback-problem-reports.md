# 64 - Feedback and problem reports

Status: done
Stage: 1b
Episode: E9 Trust
Blocked by: 21
Stories: 8, 9, 89

## What to build

Admins send feedback or a problem report from any admin page; it arrives in the operator console with the Organisation, user and page attached. Guardians get a separate 'technical problem' link in the portal and public pages that reaches the operator with the Organisation and page attached, distinct from the camp's own contact shown for questions about the camp. The operator is notified by email of new reports.

## Acceptance criteria

- [x] An admin report stores Organisation, user, page URL and text, and appears in the console.
- [x] A guardian technical report stores Organisation and page and does not expose the guardian's family data to the operator beyond what they typed.
- [x] The portal shows the Camp's contact for questions and the technical link separately.
- [x] Report endpoints are rate limited.

## Notes

- Spec sections: User stories 8, 9, 89.
- The console sees only what the report contains; no participant data access without a support grant.

## Comments

2026-11-07 - **Done.** `problem_reports` (a platform table: kind, Organisation, admin or the guardian's optional email, page, text, sent, resolved). `POST /feedback` (any member, in their Organisation) and `POST /problem-reports` (public, on the Organisation's subdomain, so the portal too) store a report and email the Platform operator from the platform job `console.problem-reported`; both are limited per address and per admin or Organisation (`PROBLEM_REPORT_LIMIT_PER_IP`/`_PER_TARGET`). The console lists them open first (`GET /console/problem-reports`) and marks them dealt with. UI: "Napsat zpětnou vazbu nebo nahlásit problém" below every admin page, "Technický problém s webem? Napište nám" in the footer of every page of an Organisation (separate from the Camp's contact on the portal cards), and the list in the console.
