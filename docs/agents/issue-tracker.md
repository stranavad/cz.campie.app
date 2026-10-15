# Issue tracker: Local Markdown

Issues for this repo live as markdown files in `docs/issues/`.

## Conventions

- The v1 spec is `docs/spec.md`; the episode and dependency overview is `docs/plan.md`.
- One file per issue: `docs/issues/<NN>-<slug>.md`, numbered globally, never a single combined tickets file.
- Each issue starts with `Status:`, `Stage:`, `Episode:`, `Blocked by:` and `Stories:` lines. Status strings are in `triage-labels.md`.
- An issue is unblocked when every issue in its `Blocked by` line is done.
- When work starts, set `Status: in-progress`; when it is merged, set `Status: done`.
- Comments and history append to the bottom of the file under a `## Comments` heading.
- Keep `docs/plan.md` in sync when adding, splitting or renumbering issues. New issues take the next free number.

## When a skill says "publish to the issue tracker"

Create a new file in `docs/issues/` with the next free number and add it to `docs/plan.md`.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the issue number.
