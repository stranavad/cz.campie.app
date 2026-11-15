# Plan 009: No high-severity advisory remains in the API's production dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report - do not improvise. When done, update the status row for this plan
> in `plans/README.md` - unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a44a934..HEAD -- pnpm-lock.yaml pnpm-workspace.yaml apps/api/package.json`
> If the lockfile changed since this plan was written, run `pnpm audit --prod --audit-level high` first: if it already exits 0, mark this plan `REJECTED (fixed independently)` and stop.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a44a934`, 2026-11-11

## Why this matters

`pnpm audit --prod` reports two high-severity advisories on the API's request path, both denial of service: one in `body-parser` (GHSA-27r3-jxmh-p828, fixed in 2.4.0) and one in `multer` (GHSA-q7qp-rjg7-q26m, fixed in 2.5.0). Both come in through `@nestjs/platform-express`, which every request and every file upload passes through. The API is public (registration forms, guardian uploads), so anyone can reach them.

## Current state

- `apps/api/package.json:27` - `"@nestjs/platform-express": "^12.1.3"`.
- `pnpm-lock.yaml` resolves `@nestjs/platform-express@12.1.3`, which depends on `express: 5.2.1` and, pinned exactly, `multer: 2.4.0`; `express` brings `body-parser@2.3.0`.
- `pnpm-workspace.yaml` - workspace settings. It has `minimumReleaseAgeExclude` (a minimum release age is enforced for new versions, with named exceptions) and `allowBuilds`, and no `overrides` yet:

  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  minimumReleaseAgeExclude:
    - '@vitest/mocker@5.0.5'
    ...
  ```

- `docs/adr/0003-stack-versions.md` fixes the stack's major versions (NestJS 12, Express through it). Stay inside them: no major bumps.
- Uploads go through `FileUploadGuard` (`apps/api/src/core/files/file-upload.ts`), covered by `apps/api/src/core/files/files.integration.test.ts`.
- API tests need Docker running (Testcontainers starts PostgreSQL; Redis too).

## Commands you will need

| Purpose                    | Command                                          | Expected on success         |
| -------------------------- | ------------------------------------------------ | --------------------------- |
| Audit                      | `pnpm audit --prod --audit-level high`           | exit 0, no high or critical |
| Why a package is installed | `pnpm why -r multer` / `pnpm why -r body-parser` | the dependency path         |
| Install                    | `pnpm install`                                   | exit 0                      |
| Typecheck                  | `pnpm check-types`                               | exit 0                      |
| API tests                  | `pnpm --filter api test`                         | all pass                    |
| Format check               | `pnpm format:check`                              | exit 0                      |

## Scope

**In scope**:

- `pnpm-lock.yaml`
- `pnpm-workspace.yaml` (an `overrides` entry, only if step 2 is needed)
- `apps/api/package.json` (only if a patch or minor bump of `@nestjs/platform-express` and its sibling `@nestjs/*` packages is what fixes it)

**Out of scope**:

- Any major version bump (ADR-0003).
- The two moderate advisories the audit also lists.
- Adding `pnpm audit` to CI: a policy choice for the maintainer, see maintenance notes.
- Application code.

## Git workflow

- Branch: `build/patch-body-parser-and-multer`
- Conventional Commits, lowercase imperative subject, at most 72 characters, no body, no AI attribution.
- Suggested subject: `build: update body-parser and multer past their advisories`
- Do NOT push or open a PR unless instructed. Never `--no-verify`.

## Steps

### Step 1: Try the plain update

Run `pnpm update -r --depth Infinity body-parser multer`, then `pnpm why -r multer` and `pnpm why -r body-parser`.

`body-parser` is a ranged dependency of `express`, so this alone should move it to 2.4.0 or later. `multer` is pinned exactly by `@nestjs/platform-express`, so it will likely stay at 2.4.0. Check whether a newer `@nestjs/platform-express` 12.x pins a fixed `multer`: `pnpm view @nestjs/platform-express@^12 dependencies.multer`. If the newest 12.x says `2.5.0` or later, update all `@nestjs/*` packages in `apps/api/package.json` together to that same version (`pnpm --filter api update "@nestjs/*"`) and skip step 2.

**Verify**: `pnpm audit --prod --audit-level high` -> note which advisories remain.

### Step 2: Override what is still pinned

Only if `multer` (or `body-parser`) is still below its fixed version: add to `pnpm-workspace.yaml`, with the comment, and run `pnpm install`:

```yaml
# Past GHSA-q7qp-rjg7-q26m (multer) until @nestjs/platform-express pins a fixed version itself; remove then.
overrides:
  multer: ^2.5.0
```

Add `body-parser: ^2.4.0` to the same block only if step 1 did not move it.

**Verify**: `pnpm audit --prod --audit-level high` -> exit 0.

### Step 3: Prove nothing broke

**Verify**: `pnpm check-types` -> exit 0; `pnpm --filter api test` -> all pass (uploads are covered by `files.integration.test.ts` and the document upload tests); `pnpm format:check` -> exit 0.

## Test plan

No new tests: the existing upload and request-body integration tests are the regression net. The audit command is the acceptance test.

## Done criteria

- [ ] `pnpm audit --prod --audit-level high` exits 0
- [ ] `pnpm why -r multer` shows 2.5.0 or later; `pnpm why -r body-parser` shows 2.4.0 or later
- [ ] `pnpm check-types` and `pnpm --filter api test` exit 0
- [ ] `git status` shows only in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

- `pnpm install` refuses the fixed versions because of the minimum release age: report the versions and their release dates; do not add them to `minimumReleaseAgeExclude` on your own.
- The fix needs a major bump of any package.
- An upload test fails after the update: report the failure output; do not patch application code.
- The audit shows new high advisories that were not there at planning time: fix the two named here, list the new ones in your report.

## Maintenance notes

- Remove the override once `@nestjs/platform-express` depends on a fixed `multer` (check on the next NestJS update).
- Worth deciding separately: a CI step `pnpm audit --prod --audit-level high` in `.github/workflows/ci.yml`. It catches the next one early, at the price of CI going red on the day an advisory is published.
