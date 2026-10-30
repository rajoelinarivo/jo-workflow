---
name: golden-tests
description: "Add snapshot / golden-file tests that compare produced output against reviewed reference files: choose what to snapshot, normalize nondeterminism (timestamps, ids, ordering, paths), review diffs, and update goldens only through an explicit, reviewed procedure. Use when the user says snapshot test, golden file, approval test, compare output, lock down rendered output/CLI output/generated code/API responses, or update snapshots."
category: tests
user-invocable: true
argument-hint: "[output to snapshot or snapshots to update]"
---
# Golden tests

## 1. Decide what to snapshot
Good candidates: large structured or textual outputs where exact content matters and is reviewable:
- rendered templates, HTML, emails, reports
- CLI output and help text
- generated code, compiler/transpiler output
- serialized API responses and file formats
- UI component render trees (use sparingly)
Bad candidates: small values (use a normal assertion), outputs that change on every run by nature, huge binary blobs nobody can review.

## 2. Use the project's mechanism
- Check for an existing snapshot library or golden-file helper and follow its conventions (location, file extension, update flag).
- If none exists, use the test framework's built-in snapshot support or a small helper: read `testdata/<name>.golden`, compare, and on mismatch print a unified diff.
- Golden files are committed, human-readable, with stable formatting (pretty-printed, sorted keys, trailing newline).

## 3. Normalize nondeterminism
Before comparing, make output deterministic, preferably by injecting fixed inputs, otherwise by scrubbing:
- timestamps and durations -> fixed clock, or replace with `<TIMESTAMP>`
- generated ids, UUIDs, random values -> seeded generator, or `<ID-1>`, `<ID-2>` in order of appearance
- unordered collections -> sort before serializing
- absolute paths, hostnames, usernames, temp dirs -> relative paths or `<TMP>`
- platform line endings -> normalize to `\n`
- floating point -> fixed precision
- versions and build numbers -> placeholder
Normalization must not hide the behavior under test.

## 4. Write the test
- One golden per scenario, named after the scenario.
- Keep inputs in versioned fixture files next to their goldens.
- On failure, show a readable diff and the command to update.

## 5. Run
`{{commands.test}}` (or `{{commands.test-unit}}`). Run twice and on a clean checkout to prove stability.

## 6. Update procedure (explicit, never blind)
1. Run the tests and read every diff.
2. Classify each change: intended (caused by this change) or unintended (a bug).
3. Fix unintended changes in code. Never update a golden to make a bug pass.
4. Regenerate only the intended goldens with the explicit update flag/env var (the project's documented one), scoped to the affected tests.
5. Review the golden file diff in version control as carefully as code; mention changed goldens in the change summary.
Document the update command in `.harness/memory/conventions.md`.

## Definition of done
- Snapshots are deterministic across runs, machines and OSes.
- Each golden is small enough to review and named after its scenario.
- Update procedure documented; no golden updated without a reviewed diff.

## Pitfalls
- Running with the update flag by default or in CI: tests can never fail.
- Snapshotting everything: reviewers stop reading diffs.
- Normalizing so aggressively that the snapshot asserts nothing.
- OS-dependent output (path separators, line endings, locale).
