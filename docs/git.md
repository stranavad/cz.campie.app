# Git

## Commits

History reads as a list of small, self-explaining changes: the subject says what, the issue says why. One commit is one logical change: code together with its tests and docs, revertable on its own. Unrelated changes go in separate commits.

```
feat: add sibling discount to pricing

Relates: docs/issues/27-sibling-discount-and-discount-codes.md
```

Format: [Conventional Commits](https://www.conventionalcommits.org), enforced by commitlint in the `commit-msg` hook.

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `revert`, `chore`.
- Subject: lowercase, imperative, no final period, at most 72 characters, in the glossary's terms (`CONTEXT.md`).
- No body beyond the `Relates:` line, which points at the issue file; leave it out when there is no issue.
- No AI attribution: no `Co-Authored-By` trailer, no "Generated with..." line, in commits or pull requests.

## Branches

`<type>/<NN>-<slug>` after the issue, e.g. `feat/27-sibling-discount`. Work without an issue: `<type>/<slug>`.

## Hooks

Husky runs on every commit:

- `pre-commit`: Prettier and Oxlint on staged files, then a full type check, so broken code doesn't land.
- `commit-msg`: commitlint.

When a hook fails, fix the cause and commit again. Never `--no-verify`, never `HUSKY=0`.

## Pull requests

- One issue per pull request where possible; the title follows the commit format.
- The body says what changed and why, links the issue file, and says how it was verified (tests, a manual check in the running app).
- After merge, the issue's `Status:` becomes `done`.
