# 84 - Setup steps on the admin home

Status: in-progress
Stage: 1b
Episode: E2 Camp setup
Blocked by: 23, 25, 30, 73
Stories: -

## What to build

A new Organisation lands on an empty Přehled and has to find out by itself what stands between it and the first Registration. Přehled gets a card "První kroky" listing what is still missing, each step with a link to the place where it is done. The card goes away by itself once nothing is missing; there is nothing to dismiss and nothing stored.

## Decisions

- **Steps come from the data, never from a flag.** A step is done when the thing exists, so the card cannot drift from reality and survives a week-long break in the middle.
- **Three steps**, in this order:
  1. the Organisation's bank account is filled in (guardians' payment details and the QR platba need it);
  2. the Camp has a Turnus;
  3. the Camp's registration form is published.
     Signup already creates the first Camp, and approval is shown by the existing status notice, so neither is a step.
- **Which Camp.** The steps describe the Camp closest to taking Registrations: the one with both a Turnus and a published form, else the one with either, else the oldest. A Turnus in one Camp and a published form in another therefore do not count as done.
- **Where.** `GET /setup-progress` (Camp settings read) answers `{ bankAccount, campId, turnus, registrationForm }`; `campId` is null only for an Organisation without a Camp. It tells whether a bank account is set, never the account itself, which stays with the Owners.
- **Who sees it.** Admins with Camp settings read. The bank account step links to the Organisation's settings only for an Owner; other admins read that an Owner sets it.
- **No tour library.** A spotlight tour (driver.js or similar) may come later for single screens such as the form builder; first setup spans several pages and days, which a checklist handles and a tour does not.

## Acceptance criteria

- [ ] A new Organisation with one empty Camp has no step done; setting the bank account, adding a Turnus and publishing the form each turn their step, and only theirs.
- [ ] With a Turnus in one Camp and a published form in another, the steps describe one Camp and are not all done; a Camp with both makes them done and is the one named.
- [ ] 403 without Camp settings read.
- [ ] Organisation A's progress never reflects B's bank account, Turnusy or forms.
- [ ] Přehled shows the card while a step is missing and not at all once every step is done.

## Notes

- No audit entry: the endpoint reads counts and presence, no personal data.
- Design: follows the "Čeká na vás" card of `B3-Prehled`; the canvas has no artboard for it.

## Comments

2026-11-16 - **In progress.** `GET /setup-progress` (Camp settings read) answers `bankAccount`, `campId`, `turnus` and `registrationForm` from what exists, the two Camp steps for the Camp closest to taking Registrations (both steps, else either, else the oldest). Přehled shows "První kroky" above the occupancy for admins with Camp settings read: a progress bar, the three steps with a link each (Organisation settings for an Owner, the Camp's Turnusy and form sections), and nothing once all are done or while the progress cannot be read. Tested over HTTP: each step alone, the choice of Camp, an Organisation without a Camp, permissions and isolation. The card itself is not yet checked in a browser.
