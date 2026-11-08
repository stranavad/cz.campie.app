# 69 - Readable audit log

Status: done
Stage: 1b
Episode: E9 Trust
Blocked by: 10, 65
Stories: 29, 30

## What to build

The audit log speaks the Owner's language instead of the platform's. Today "Historie změn" shows raw action keys (`registration_guardian.update`), target types, target UUIDs and a JSON diff of whole entity rows including `id`, `organisationId` and timestamps; the Registration detail's history card translates some actions but prints values as JSON. Both views render each Audit entry as a Czech sentence about a named record, with a human list of what changed, and keep the technical data one click away.

## Decisions

- **Scope.** The Organisation's "Historie změn" page and the Registration detail's history card, sharing one translation and formatting module. The platform audit log in the operator console stays technical.
- **Typed action catalogue.** `AUDIT_ACTIONS` in `packages/schema` lists every action as `<target type>.<verb>`; `AuditService.record` accepts only those, and the UI maps them with a `Record<AuditAction, ...>`, so a missing translation is a type error. Target types derive from the catalogue.
- **Row shape.** A verbal-noun sentence, gender-neutral: "Úprava tábora Letní tábor 2027", the actor beside it ("jana@example.cz - Správce"), then the changes. A collapsed "Podrobnosti" holds the action key, target UUID, IP address and any field without a translation.
- **Actor terms.** Správce / Zákonný zástupce / Podpora platformy / Systém in both views.
- **Noise out at write time.** `changesBetween` drops `id`, `organisationId`, foreign keys (`*Id`), `createdAt`, `updatedAt` and a named list of further internal fields. Existing entries keep theirs and show them under "Podrobnosti".
- **Target names resolved at read time.** The API returns a label per entry by target type: Camp and Turnus by name, Registration by its Participants' names and variabilní symbol, member by email, Consent and Document type by name; linked where a page exists (Registration detail, Camp). Nothing personal is snapshotted into the append-only log. A target that no longer exists shows its type with "(již neexistuje)"; an Erased Registration shows as "vymazaná přihláška".
- **Field catalogue.** `AUDIT_FIELDS` in `packages/schema`, per target type: each field's translation key and value kind (`text | boolean | money | date | datetime | enum | list | email`). Values render as Czech text: "4 500 Kč", "Ano/Ne", "1. 7. 2027", translated enum values, "-" for empty. Per target type, not global, since `status` means different things on different records.
- **Create and remove.** `*.create` lists the new values only ("Název: Letní tábor"), `*.remove` the old values only; only updates show "old → new".
- **Encrypted fields by label.** The API returns encrypted field names as labels: standard fields from the platform catalogue, custom form fields from the Registration's form version. The UI only displays them.
- **Action filter.** The free-text "Akce (nebo její začátek)" becomes a select of areas (Tábory, Turnusy, Přihlášky, Platby, Souhlasy, Dokumenty, Členové, Nastavení organizace, ...), each an action prefix the API already filters by. No per-action select.

## Acceptance criteria

- [x] Every action recorded anywhere in the API is in `AUDIT_ACTIONS`; recording an unknown one fails type checking.
- [x] Every action and every target type has a Czech translation; a missing one fails type checking.
- [x] New entries carry no `id`, `organisationId`, `*Id`, `createdAt` or `updatedAt` in their changes.
- [x] Each entry in both views reads as a sentence naming the record; UUIDs, the action key and IP address appear only under "Podrobnosti".
- [x] Money, booleans, dates and enum values render formatted in Czech; create and remove entries list one side only.
- [x] Custom form fields in encrypted-field lists show their labels in both views.
- [x] A removed target and an Erased Registration render without error and without personal data of the Erased Registration.
- [x] Health entries stay hidden from admins without Health read, labels included.
- [x] Target labels of Organisation A never resolve for entries of B.
- [x] Filtering by area returns exactly that area's entries.

## Notes

- Spec sections: Identity, permissions and audit; Removing a Registration.
- Today's translations of 18 actions live in `participants.json` under `detail.action`; they move into the shared module.

## Comments

2026-11-08 - **Implemented, awaiting merge.** `@repo/schema/audit` holds the catalogue and the reading rules: `AUDIT_ACTIONS` maps every action to its area and the kinds of record it may target (several target another record than their subject, a guardian's change its Registration), `AUDIT_FIELDS` names fields per subject with their value kind, and the pure `auditChangesOf` writes changes in Czech, one-sided for created and removed records, people in lists by name only, a change that reads the same on both sides left for the details. `AuditService.record` takes only catalogue actions on their target kinds; the platform log has its own `PLATFORM_AUDIT_ACTIONS` in the API. `changesBetween` leaves out `id`, `organisationId`, `*Id` (outside identifiers `merchantId` and `gatewayTransactionId` kept), timestamps and a few internal fields.

- Both endpoints name each record at read time through `AuditEntryService` (organisations module, used by the Registration history): Camp, Turnus, Registration (Participants and Variable symbol), Participant, member, admin, invitation, Consent, Document type, Discount code, Organisation and undeliverable email; links to the Registration detail and the Camp. Removed records read as removed, Erased Registrations and their Participants as erased with nothing personal. Encrypted form fields come with their labels; health entries and health field labels stay hidden without Health read. The history keeps leaving out IP addresses.
- The audit log filters by `area` (an exact list of the area's actions, since an area such as Přihlášky spans several prefixes); the free-text action filter is gone.
- UI: `core/audit` with the `audit` namespace renders both views alike: the sentence, the actor (Správce, Zákonný zástupce, Podpora platformy, Systém), the changes, and "Podrobnosti" with the action key, the record id, the IP address and untranslated fields. A missing action, target type or field text fails type checking through the typed keys.
- Changed recording: `registration.move` records the Turnus names, since `turnusId` is left out; `internal_document.view` targets the Participant with the document's upload time, since the link from the view to the child used to go through the creation entry's recorded `id`.
- Open: nested values (form answers, permissions, price lines, declarations) appear only under "Podrobnosti"; consent signatures and files, form files and versions, legal acceptances and login links have no name, so the sentence names only the action for them.
