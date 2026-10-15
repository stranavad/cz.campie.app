# 35 - Submission and placement

Status: ready-for-agent
Stage: 1a
Episode: E3 Public registration
Blocked by: 10, 31, 34
Stories: 63, 64, 67, 69, 70, 71, 72, 77

## What to build
Submitting the public form creates a Registration in one Turnus with its Participants, guardians, answers (core as typed columns, standard under platform keys, custom under field ids, sensitive ones encrypted), the form version, the declaration answers with time and IP address, the payment choice and the frozen price lines from the pricing module. The server re-checks everything: the Turnus is inside its Registration window, not manually closed, age limits, form validation. In one serialised step per Turnus it checks capacity against Registered Participants and inserts, and in the same step it takes a Discount code use, locking the code so the limit cannot be exceeded. A Variable symbol is generated (two digits of the Prague year plus six random digits, unique within the Organisation, regenerated on a clash). An idempotency key from the form prevents an accidental double submit from creating two Registrations. A rejected submission returns field-level reasons so the form keeps its data. Background jobs for the PDF and emails are enqueued (issues 36, 37).

## Acceptance criteria
- [ ] Concurrent submissions for the last place: exactly one succeeds, the other gets "full" (API seam test with real PostgreSQL).
- [ ] Concurrent submissions with a code that has one use left: exactly one gets the discount, the other is rejected at the code field.
- [ ] Window, manual close and age limits block submission with specific error keys; window boundaries tested with the Clock.
- [ ] Same idempotency key twice returns the first Registration and creates nothing new.
- [ ] Variable symbol format and uniqueness within the Organisation; clash retry tested with a forced clash.
- [ ] Price lines stored equal the price-preview result; later price list changes do not alter them.
- [ ] Encrypted fields are ciphertext in the database.
- [ ] Declaration answers stored with time and IP; mandatory unchecked declarations reject.
- [ ] Organisation not approved or suspended: submission rejected.
- [ ] Audit entry with actor guardian (by email) and the submission.
- [ ] Jobs enqueued; the HTTP response does not wait for them.

## Notes
- Spec sections: Registration, placement and declarations; Pricing; Payments (Variable symbol).
- Port from Domino: `apps/api/src/registration/services/registration.service.ts` (generateVariableSymbol, clash retry) and `registration-process.service.ts`.
- Serialisation: e.g. `SELECT ... FOR UPDATE` on the Turnus row and the code row inside the unit of work.
