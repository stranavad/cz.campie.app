# Implementation plan: Campie (v1)

Source: `docs/spec.md`, glossary `CONTEXT.md`, decisions `docs/adr/`. Issue files: `docs/issues/NN-<slug>.md` (stage 1 only; stages 2 and 3 are broken down once 1a is under way and the pilot camps have done their paper exercise).

**Episode** = a demoable vertical chunk. **Issue** = one agent-sized ticket ending in tests on one of the two seams (API against real PostgreSQL with RLS, or a pure module). `Blocked by` lists issue numbers. Status uses `docs/agents/triage-labels.md`.

## Stage 1a - registration opens (February 2027)

### E0 Foundation - "empty platform runs locally and in CI"

| #   | Issue                                                           | Status          | Blocked by |
| --- | --------------------------------------------------------------- | --------------- | ---------- |
| 01  | Verify stack versions, record as ADR                            | ready-for-human | -          |
| 02  | Repo scaffold: pnpm + Turborepo, api/app/schema, AGPL, lint, CI | ready-for-agent | 01         |
| 03  | Docker Compose local stack                                      | ready-for-agent | 02         |
| 04  | Spike: RustFS as S3 for the AWS SDK                             | ready-for-agent | 03         |
| 05  | Spike: Neon WebSocket driver with `SET LOCAL` in transactions   | ready-for-agent | 02         |
| 06  | Ports and adapters skeleton                                     | ready-for-agent | 02, 04     |
| 07  | DB core: Drizzle, RLS, non-bypass role, unit of work            | ready-for-agent | 05, 06     |
| 08  | API test harness with real PostgreSQL and port fakes            | ready-for-agent | 07         |
| 09  | Encryption core: per-Organisation data keys                     | ready-for-agent | 08         |
| 10  | Audit log core                                                  | ready-for-agent | 08         |
| 11  | Background jobs with Organisation context                       | ready-for-agent | 08         |
| 12  | Encrypted file service and short-lived download links           | ready-for-agent | 06, 09     |
| 13  | Frontend scaffold: hostname mode, i18n, `/api` proxy            | ready-for-agent | 02         |
| 14  | Cookie sessions, CSRF, Organisation resolution                  | ready-for-agent | 08, 13     |
| 15  | PDF pipeline                                                    | ready-for-agent | 06, 11     |
| 16  | Email pipeline: React templates, two streams                    | ready-for-agent | 11         |

### E1 Organisations and identity - "a camp signs up, gets approved, invites colleagues"

| #   | Issue                                         | Status          | Blocked by |
| --- | --------------------------------------------- | --------------- | ---------- |
| 17  | Organisation signup                           | ready-for-agent | 10, 14, 16 |
| 18  | Admin password auth                           | ready-for-agent | 14, 16     |
| 19  | Memberships, permission areas, Owners         | ready-for-agent | 17, 18     |
| 20  | Invitations and user management               | ready-for-agent | 19         |
| 21  | Platform operator console with mandatory TOTP | ready-for-agent | 19         |
| 22  | Rate limiting                                 | ready-for-agent | 14         |
| 23  | Organisation settings and branding            | ready-for-agent | 12, 19     |

### E2 Camp setup - "admin configures a Camp end to end"

| #   | Issue                                                        | Status          | Blocked by |
| --- | ------------------------------------------------------------ | --------------- | ---------- |
| 24  | Camps, slugs, module switches                                | ready-for-agent | 19         |
| 25  | Turnusy with price list, Deposit and dates                   | ready-for-agent | 24         |
| 26  | Pricing pure module                                          | ready-for-agent | 02         |
| 27  | Sibling discount and Discount codes                          | ready-for-agent | 25, 26     |
| 28  | Form engine pure module                                      | ready-for-agent | 02         |
| 29  | Standard field catalogue                                     | ready-for-human | 28         |
| 30  | Form builder and form versions                               | ready-for-agent | 24, 28     |
| 31  | Registration declarations                                    | ready-for-agent | 12, 30     |
| 32  | Email texts, notification recipients, contact-edit lock date | ready-for-agent | 16, 24     |

### E3 Public registration - "guardian registers and gets a confirmation"

| #   | Issue                                    | Status          | Blocked by |
| --- | ---------------------------------------- | --------------- | ---------- |
| 33  | Public landing, Camp and Turnus pages    | ready-for-agent | 13, 23, 25 |
| 34  | Public form with live price              | ready-for-agent | 27, 30, 33 |
| 35  | Submission and placement                 | ready-for-agent | 10, 31, 34 |
| 36  | Přihláška PDF with QR platba             | ready-for-agent | 15, 35     |
| 37  | Confirmation and new-Registration emails | ready-for-agent | 32, 36     |

### E4 Money - "payments are tracked"

| #   | Issue                                   | Status          | Blocked by |
| --- | --------------------------------------- | --------------- | ---------- |
| 38  | Payment ledger, amount due now, Overdue | ready-for-agent | 35         |

### E5 Guardian portal - "guardian comes back"

| #   | Issue                                                   | Status          | Blocked by |
| --- | ------------------------------------------------------- | --------------- | ---------- |
| 39  | Guardian login link and sessions                        | ready-for-agent | 14, 16, 35 |
| 40  | Portal: Registrations, balance, QR, Přihláška           | ready-for-agent | 36, 38, 39 |
| 41  | Portal: contact edits, guardian emails, new form fields | ready-for-agent | 30, 39     |

### E6 Admin Registrations - "admin runs the season"

| #   | Issue                                                   | Status          | Blocked by |
| --- | ------------------------------------------------------- | --------------- | ---------- |
| 42  | Participant list with search and Selected Turnus        | ready-for-agent | 19, 35     |
| 43  | Registration detail and change history                  | ready-for-agent | 38, 42     |
| 44  | Admin create, edit and move Registration                | ready-for-agent | 43         |
| 45  | Cancel, Cancel all, access emails, regenerate Přihláška | ready-for-agent | 37, 44     |
| 46  | Simple Participant export                               | ready-for-agent | 42         |
| 47  | Public data and processors page                         | ready-for-human | 13         |

## Stage 1b - before payments and paperwork are due (April 2027)

| #   | Issue                                          | Episode      | Status          | Blocked by |
| --- | ---------------------------------------------- | ------------ | --------------- | ---------- |
| 48  | Comgate adapter with per-Organisation keys     | E4           | ready-for-agent | 23, 38     |
| 49  | Card payment on submission and from the portal | E4           | ready-for-agent | 40, 48     |
| 50  | Payment reminders                              | E4           | ready-for-agent | 38, 42     |
| 51  | Consents: model, versions, editor              | E7 Consents  | ready-for-agent | 12, 24     |
| 52  | Starter Consents                               | E7           | ready-for-human | 51         |
| 53  | Consent signing and signed PDF                 | E7           | ready-for-agent | 15, 39, 51 |
| 54  | Withdraw, re-sign, Declined items              | E7           | ready-for-agent | 53         |
| 55  | Admin Consent status and downloads             | E7           | ready-for-agent | 53         |
| 56  | Document types                                 | E8 Documents | ready-for-agent | 12, 24     |
| 57  | Guardian document upload                       | E8           | ready-for-agent | 39, 56     |
| 58  | Admin document review and Internal documents   | E8           | ready-for-agent | 57         |
| 59  | Participant checklist                          | E5           | ready-for-agent | 41, 53, 57 |
| 60  | Open-items reminder                            | E5           | ready-for-agent | 59         |
| 61  | Turnus overview and list filters               | E6           | ready-for-agent | 38, 42, 59 |
| 62  | Export presets and payments export             | E6           | ready-for-agent | 46         |
| 63  | Support access                                 | E9 Trust     | ready-for-agent | 10, 21     |
| 64  | Feedback and problem reports                   | E9           | ready-for-agent | 21         |
| 65  | Audit log browser                              | E9           | ready-for-agent | 10, 19     |
| 66  | Erase a Registration                           | E9           | ready-for-agent | 12, 45     |
| 67  | TOTP for admins and enforcement                | E1           | ready-for-agent | 18, 21     |
| 68  | Bounce and complaint handling                  | E3           | ready-for-agent | 16, 42     |

## Stage 2 - around May 2027 (to be broken down)

- **E10 Health record**: preset via form engine with medications, per-Camp config, complete-by date, guardian fill and states, admin read/write/reopen/on paper, view audit, Health gating, health note behaviour.
- **E11 Generated documents and messages**: Potvrzení o účasti, Posudek o zdravotní způsobilosti, Prohlášení o bezinfekčnosti, admin generation, free-form message.

## Stage 3 - late June 2027 (to be broken down)

- **E12 Oddíly**, **E13 Vedoucí**, **E14 Camp health log**, **E15 Printouts** - ports from Domino.

## After the season - autumn 2027

- Post-Turnus cleanup and its reminder, Owner full export, platform usage counts.

## Non-code dependencies (start now)

- Pilot camps paper exercise - blocks freezing 26 and 29.
- Legal texts (terms, data processing agreement) - block approving the first Organisation (21).
- Starter Consent licence - blocks 52.
- Product name and domain: decided - Campie, `campie.cz`, repository `cz.campie.app`. Mail domain warm-up and DKIM before the first pilot approval.
- Contribution policy.
- Backend hosting decision - must allow the same-origin proxy (ADR-0001); blocks production, not development.

## Critical path for 1a

01 → 02 → 05 → 07 → 08 → 14 → 17 → 19 → 24 → 25 → 30 → 34 → 35 → 38/39 → 40. Pure modules 26 and 28 and the frontend scaffold 13 run in parallel from 02.
