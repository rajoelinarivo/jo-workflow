---
name: regression-tests
description: "Build a non-regression baseline that records the current version's outputs on a representative corpus and compares them after a change, reporting every difference. Essential before a migration, refactor, dependency upgrade or performance rewrite. Use when the user says non-regression, regression baseline, make sure nothing changes, compare old vs new behavior, before/after comparison, or safety net for a migration/refactor."
category: tests
user-invocable: true
argument-hint: "[component or entry point to baseline]"
---
# Regression tests (behavior baseline)

Goal: prove that the new version produces the same observable results as the old one, or that every difference is intended.

## 1. Pick the observation point
- Choose stable, externally observable entry points: CLI invocation, public function, HTTP endpoint, batch job, file transformation.
- Define what is compared: stdout/stderr, exit code, response body/status/headers, produced files, database state, emitted events.
- Prefer coarse entry points; they survive internal restructuring.

## 2. Build the corpus
- Collect representative inputs: real-world samples (anonymized, no secrets or personal data), existing test fixtures, edge cases from bug history, boundary values, malformed inputs.
- Aim for breadth over volume. Include at least one case per known feature path.
- Store the corpus under version control (e.g. `regression/corpus/`), or reference a reproducible download if too large.

## 3. Record the baseline on the current version
- Check out the reference version (record its commit hash).
- Build it with `{{commands.build}}` and run every corpus input through the entry point with a small driver script.
- Save outputs as `regression/baseline/<case>.out` with the commit hash in a manifest file.
- Normalize nondeterminism as in `golden-tests` (timestamps, ids, ordering, paths). Run the recording twice: the two baselines must be identical. If not, normalize more until they are.

## 4. Compare after the change
- Build the new version and run the same driver to produce `regression/current/`.
- Diff case by case; produce a summary: identical / changed / new failures / crashes.
- For numeric outputs, compare with an explicit tolerance and state it.

## 5. Triage every difference
For each changed case:
- Intended (part of the requested change, or a documented upstream behavior change)? Record it in the change summary or `MIGRATION.md`.
- Unintended? It is a regression: fix it (use `bug-hunt`), add a focused unit or integration test, rerun the comparison.
Do not re-record the baseline to make differences disappear. Re-baseline only after all differences are triaged and approved, and record the new reference commit.

## 6. Make it repeatable
- One command to record and one to compare (script or build task), documented in `.harness/memory/conventions.md`.
- Optionally wire the compare step into `{{commands.test}}` or CI for the duration of a migration.

## Definition of done
- Baseline recorded from a known commit, deterministic across two runs.
- After the change, zero unexplained differences.
- Intended differences listed with justification.

## Pitfalls
- A corpus that only covers the happy path.
- Comparing against a baseline recorded on a different machine/config without normalizing.
- Treating the baseline as truth: it records current behavior, including current bugs. Fixing a bug is an intended difference that must be documented.
- Sensitive data in the corpus.

Record findings about unexpected behavior differences in `.harness/memory/lessons.md`.
