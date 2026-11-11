# 83 - Support access: switching Organisations and leaving

Status: in-progress
Stage: 1b
Episode: E9 Trust
Blocked by: 63
Stories: 7, 28, 29

## Problem Statement

The Platform operator can hold support grants from several Organisations at once, but the admin interface works in one Organisation at a time and has no say in which. It always acts in the support Organisation granted most recently, so entering another one from the console can drop the operator back into the first. When the operator is also a member of an Organisation of their own, that membership always wins and no support Organisation can be worked in from the admin pages at all.

The operator also cannot leave an Organisation after helping. An entry lasts until the grant ends, the Owner revokes it or the operator logs out. The Owner's audit log shows when the operator came in but never when they finished, so the Owner cannot tell a ten-minute visit from one that lasted the whole grant.

## Solution

Each entry under a grant becomes a visit, which is open until the operator leaves it. A session has at most one open visit, so the operator is always in at most one support Organisation, and the admin interface works in that one, ahead of any membership of their own. The support banner gets a "Opustit" button that ends the visit, writes it to the Organisation's audit log and returns the operator to the console. Entering another Organisation from the console first leaves the one they are in. Entering again later starts a new visit and is logged again.

## User Stories

1. As the Platform operator, I want the admin pages to work in the Organisation I entered last, so that clicking "Vstoupit" takes me where I clicked.
2. As the Platform operator, I want to hold support grants from several Organisations and move between them from the console, so that I can help more than one Organisation in a day.
3. As the Platform operator, I want to be in only one support Organisation at a time, so that I never confuse whose data I am looking at.
4. As the Platform operator, I want a "Opustit" button in the support banner, so that I can end my visit as soon as I have finished helping.
5. As the Platform operator, I want to land on the console after leaving, so that I can enter another Organisation or carry on with platform work.
6. As the Platform operator, I want "Vstoupit" on another Organisation to leave the current one for me, so that switching takes one click.
7. As the Platform operator, I want the console to show which Organisation I am in now, so that I know where "Opustit" would take me out of.
8. As the Platform operator who is also a member of an Organisation, I want an entered support Organisation to take precedence over my own membership, so that I can actually work under the grant.
9. As the Platform operator who is also a member of an Organisation, I want to be back in my own Organisation after leaving, so that leaving support does not lock me out of my own work.
10. As the Platform operator, I want the admin home to point me to the console while I am in no Organisation, so that a support grant I have not entered never shows me pages that cannot load.
11. As the Platform operator, I want to be able to enter an Organisation again under the same grant after leaving it, so that I can come back when the Owner writes again.
12. As the Platform operator, I want leaving to work under a read-only grant, so that read-only support can be ended like any other.
13. As the Platform operator, I want a visit to an Organisation whose grant has ended not to block me from entering another, so that an expired or revoked grant never strands me.
14. As an Owner, I want my audit log to show when the Platform operator left, so that I can see how long each support visit lasted.
15. As an Owner, I want each separate visit under one grant logged as its own entry, so that I can tell how many times the operator came in.
16. As an Owner, I want the operator's access to my data to end when they leave, even while my grant still runs, so that support access is only used while it is needed.
17. As an Owner, I want leaving and entering in my audit log to name the Platform operator as the actor, so that I know who came and went.
18. As an Owner, I want the operator's visits to other Organisations never to appear in my audit log, so that my log holds only my Organisation's events.

## Implementation Decisions

- **Visit model.** The support entries platform table changes from one row per session and grant to one row per visit: its own UUIDv7 id, the grant, the session, when it was entered and when it was left (null while open). A partial unique index on the session where the visit is still open keeps a session to at most one open visit. The migration drops the old primary key. Existing rows become visits that are still open.
- **Open visit.** A visit counts as open only while it has not been left and its grant is still in force. A visit under an expired or revoked grant simply stops counting. Nobody closes it and no leave is logged, because the grant's end is already in the log.
- **Access guard.** "Entered" now means that this session has an open visit under the grant in force for the named Organisation. Everything else in the guard stays as issue 63 left it: no entry, no access; a read-only grant refuses changes.
- **Enter** (`POST /support-access/enter`, existing contract). It is idempotent while this session already has an open visit in this Organisation: no new visit and no new audit entry. When the session has an open visit in another Organisation, enter refuses with 409 and a new access error code, `support_visit_open`, and leaves that visit alone. Each Organisation's audit entries are written only in that Organisation's own unit of work; there are no writes across Organisations. Otherwise it opens a visit and records `support_access.enter`, as today.
- **Leave** (`POST /support-access/leave`, new endpoint in the shared contracts, no body, 204). Like enter, it carries the support entry exemption, so it works before entering and under a read-only grant. It closes this session's open visit in the named Organisation and records `support_access.leave` (target: the Organisation, actor: the Platform operator). With no open visit it does nothing and writes nothing. Members calling it get 403, as for enter.
- **Audit catalogue.** `support_access.leave` is added next to `enter`, with the Czech label "Odchod podpory platformy" in the readable audit log.
- **Account.** The `entered` flag on each support membership (already in the account contract) is true only for this session's open visit, so at most one support membership is entered at a time.
- **Current Organisation in the app.** The current membership is the entered support membership if there is one, otherwise the first own membership, otherwise none. A support membership that has not been entered is never current. The sidebar, Organisation badge, branding and support banner all follow it, because they read it already.
- **Support banner.** It gets a "Opustit" button. This calls leave in the current Organisation, refreshes the account and navigates to the console. If leave fails, an error is shown and the operator stays.
- **Console support list.** The Organisation the operator is in shows as current, with "Opustit" instead of "Vstoupit". On any other Organisation, "Vstoupit" first leaves the current one, then enters, refreshes the account and goes to the admin home. Enter refused with `support_visit_open` is shown as a failure. The app always leaves first, so that should not happen.
- **Query cache.** No change. Organisation data is cached per Organisation, so switching never shows one Organisation's data under another.

## Testing Decisions

- One seam: the API over HTTP against real PostgreSQL with RLS, extending the existing support-access integration test (issue 63). It already covers grants, entering, read-only refusal, expiry and revocation, and the account response. No new seam. The app's choice of current Organisation is not tested, because the repository has no frontend test seam.
- Each test proves one behaviour through the HTTP surface:
  - Leaving ends access: after leave, a read in that Organisation is refused with `support_entry_required`, while the grant is still in force.
  - Leave is audited once: `support_access.leave` with actor Platform operator in that Organisation's log; a second leave does nothing and writes no second entry.
  - Re-entering after leaving opens a new visit: a second `support_access.enter` lands in the log, and reads succeed again.
  - Entering a second Organisation while in the first is refused with `support_visit_open`; after leaving the first, entering the second succeeds. The account then shows the second as entered and the first as not.
  - A visit under an expired or revoked grant does not block entering another Organisation.
  - Leave works under a read-only grant.
  - A member, not the operator, gets 403 from leave.
  - Tenant isolation: the operator's enter and leave in one Organisation never appear in another Organisation's log.

## Out of Scope

- Recording a leave when the session ends by logout or expiry. The visit then ends silently, because the session's rows go with it; this is the same as today.
- More than one support Organisation open in different browser tabs of one session.
- Showing visit durations to Owners anywhere but the audit log.
- Any change to granting, revoking, grant lengths or the read-only rule.
- Owner notification when the operator enters or leaves.

## Further Notes

- This came from a support visit that dead-ended. A new session (a fresh login, or passing TOTP, which replaces the session) had not entered, yet the app showed the support Organisation as current, so every page failed with `support_entry_required`. That first part is already fixed in the working tree: the account returns `entered`, and the app treats a support Organisation as current only once it has been entered. This issue builds on that.
- Known limit carried from issue 63: a five-minute download link made during a visit still opens for up to five minutes after leaving.

## Comments

- 2026-11-11: Implemented. Two deviations forced by the partial unique index on open visits: the migration keeps only each session's latest entry before creating it (dropped entries only mean entering again), and entering closes this session's visit under a grant that has ended, as of the grant's end, without a leave in the log, so it never blocks the next visit (story 13). That close writes only the platform table `support_entries`, never another Organisation's log. Not checked in a browser yet.
