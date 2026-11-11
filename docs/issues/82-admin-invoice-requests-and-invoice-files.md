# 82 - Admin Invoice requests and invoice files

Status: done
Stage: 1a
Episode: E6 Admin Registrations
Blocked by: 81
Stories: 199, 200, 201

## What to build

Admins work with Invoice requests in the Registration evidence: they see them in the Registration detail and the list, filter those still to invoice, export the billing details for their accounting program, edit them at any time, mark them invoiced and upload the invoice and any later corrective documents. Invoice files are accounting documents: they are only ever added and survive cleanup and erasure. Guardians download them in the portal.

## Decisions

- **States.** "K vyfakturování" while `invoicedOn` is null, "Vyfakturováno" with `invoicedOn` and an optional `invoiceNumber`, set or cleared by an admin. Company paid is derived from the ledger (issue 81), shown as what is left of the company's share.
- **Admin edit.** Registrations write may create one on any Registration (also with the Camp switch off, and on admin-created ones), change every field at any time and set the amount anywhere from 0 to any whole CZK. Removing is allowed only while it has no file. Every change is an audit entry.
- **Invoice files.** Own table (Organisation-scoped, RLS) referencing the Invoice request, PDF only through the existing upload checks and the encrypted file service. Append-only: no delete or replace endpoint, the foreign key does not cascade, the post-Turnus cleanup never touches them and erasure keeps them. Uploading the first file sets `invoicedOn` to today (Prague) when it is null. Each upload is an audit entry. No email to guardians.
- **Guardian download.** The portal lists the files with their upload date and gives the usual short-lived download link.
- **List and export.** Registration list column and filter "Faktura": none, K vyfakturování, Vyfakturováno, company share open. Export catalogue gains the billing fields, amount, state, invoice date and number; the payments export gains the payer column.
- **Notification.** The new Registration email to the camp mentions the Invoice request with the company name and amount.
- **Erasure.** Keeps the Invoice request (billing details, amount, state) and its files, blanks the note. This is the spec's one exception to erasure removing every file.

## Acceptance criteria

- [ ] Admin with Registrations write creates, edits, marks invoiced and removes (no file yet) an Invoice request; removing one with a file gets 409; Registrations read sees it and gets 403 on writes.
- [ ] Uploading a PDF adds a file and sets `invoicedOn` once; a second upload keeps both files and the date; a non-PDF is rejected; there is no way to delete a file.
- [ ] Guardian downloads every file of their Registration's Invoice request through a short-lived link; another family and another Organisation get 404.
- [ ] Post-Turnus cleanup with every category leaves invoice files in place.
- [ ] Erasure keeps the Invoice request and its files and blanks its note; the stored objects still exist.
- [ ] The list filter returns exactly the Registrations in each state; the export carries the billing columns; the payments export carries the payer.
- [ ] The new Registration notification names the company and amount.
- [ ] Every change and upload is an audit entry; another Organisation's ids yield 404.

## Notes

- Spec sections: Invoice requests; Post-Turnus cleanup; Removing a Registration; Files; Export.
- Internal documents (issue 58) are deliberately not reused: they belong to a Participant, are hidden from guardians and are cleared by cleanup and erasure.

## Comments

- 2026-11-10: Implemented. Admins save an Invoice request with `PUT /registrations/:id/invoice-request` (billing details, any amount from 0, `invoicedOn` and `invoiceNumber`), whatever the Camp switch says, on public and admin-created Registrations alike; the admin create body still takes none, an admin adds one on the new Registration afterwards. `invoice_files` is its own Organisation table with a non-cascading foreign key, and the app role has no UPDATE, DELETE or TRUNCATE on it (custom migration), so cleanup and erasure cannot remove one. Only the first upload sets the date (when empty); a date an admin cleared afterwards stays cleared. Once a file exists the guardian may no longer change or remove the Invoice request, even with the date cleared. The admin card edits the billing details and the state ("Označit jako vyfakturované") as two small forms. Post-Turnus cleanup does not exist yet, so its criterion is covered only by the database privilege; its issue must keep invoice files out of every category. Not checked in a browser yet.
