# 73 - Registration list signals and admin home

Status: ready-for-agent
Stage: 1b
Episode: E6 Admin Registrations
Blocked by: 43, 44, 55, 58, 61
Stories: 104, 106, 107, 108

## What to build

The redesigned Přihlášky list and Přehled show more than the rows carry today. Each Participant row gains when the Registration was submitted ("Přihlášeno"), Consent counts ("2 / 2") instead of the `unsignedConsent` boolean, and a three-state document status (Vše odevzdáno / Ke kontrole / Chybí) instead of the `missingDocument` boolean. A Registration records whether it came in online or was entered by an admin, for the detail's subtitle. Přehled gets the most recent Registrations of the Organisation and the number of documents waiting for review in the Selected Turnus.

## Decisions

- **Row fields.** `submittedAt`; `consents: { signed, required }`, null while the Camp has Consents off; `documents: 'complete' | 'to_review' | 'missing'`, null while the Camp has documents off. `missing` when any requirement has nothing or only a returned upload, else `to_review` when any latest upload is Pending, else `complete`. The two booleans go; the `unsignedConsent` and `missingDocument` filters stay and keep their meaning. Migrate every frontend reader of the booleans in the same change, including Přehled's waiting list (`features/admin-home`, `use-waiting-list.hook.ts`).
- **Source.** Registrations gain `source: 'public' | 'admin'`, set at creation. The migration fills existing ones from their `registration.create` Audit entry's actor kind. The detail and the recent list return it.
- **Recent Registrations.** `GET /registrations/recent` (Registrations read): the Organisation's latest Registrations across its Turnusy, newest first, a fixed small number, each with `submittedAt`, `source`, the Turnus and Camp names, the Participants' names and the payment status. Erased Registrations are left out. No health data.
- **Documents to review.** The Turnus overview gains `documentsToReview`: Pending uploads of Registered Participants.
- **What needs no new endpoint.** Occupancy of every Turnus of a Camp is `GET /camps/:campId/turnusy` (`registered`, `capacity`; Camp settings read). The sidebar's Přihlášky badge reads `registered` from the Selected Turnus's overview.

## Acceptance criteria

- [ ] In a fixture with signed, unsigned and Withdrawn Consents, each row's counts are right; a Cancelled Participant shows no counts, as it has no checklist.
- [ ] In a fixture with no upload, a returned, a Pending and an approved upload and a paper hand-in, each row's document status is right; the filters return the same Participants as before.
- [ ] A public submission reads `public` and an admin-created Registration `admin`, in the detail and the recent list; the migration backfills both kinds.
- [ ] The recent list is ordered by submission, leaves out Erased Registrations and is 403 without Registrations read.
- [ ] `documentsToReview` counts only Pending uploads of Registered Participants of that Turnus.
- [ ] Recent Registrations and counts of Organisation A never include B's.

## Notes

- Spec sections: Registration, placement and declarations; Payments (Overdue); Documents.
- Design: canvas "Campie - návrhy designu", artboards `B3-Prehled`, `B3-Prihlasky`, `B3-Detail`, `Sidebar`. Consumed by the admin Přehled, the Přihlášky list, the Registration detail header and the sidebar badge.
- The detail's "Přesunout na jiný turnus" per child is not built: the spec moves whole Registrations only, and moving one child out means cancelling it and creating a new Registration.
