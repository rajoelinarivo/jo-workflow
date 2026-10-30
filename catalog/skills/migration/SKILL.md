---
name: migration
description: "Plan and execute a framework, language, runtime version, library or infrastructure migration incrementally: inventory, compatibility matrix, behavior baseline, a MIGRATION.md checklist consumed by the migrate-step loop, strangler-style increments and a rollback plan. Use when the user says migrate, upgrade to version X, port to, move from X to Y, replace framework/library, major version bump, or modernize."
category: migration
user-invocable: true
argument-hint: "[from -> to, e.g. framework v4 -> v5]"
---
# Migration

## 1. Inventory
- Define source and target precisely (exact versions, platforms).
- Read the target's official migration guide, changelog and breaking-changes list.
- Inventory what is affected: direct and transitive dependencies, APIs used (grep for imports and calls), config files, build scripts, CI, Docker/infra files, generated code, deprecated features already emitting warnings.
- Note the size: number of files/call sites per affected API.

## 2. Compatibility matrix
Build a table in `MIGRATION.md`:

| Component / dependency | Current | Target-compatible version | Breaking changes | Action |
|---|---|---|---|---|

Flag blockers (no compatible version, abandoned dependency) and resolve them first: upgrade, replace or vendor. Record significant choices as ADRs in `.harness/memory/decisions.md`.

## 3. Baseline
- Ensure `{{commands.test}}` is green on the current version. If not, stop and fix or report first.
- Capture a behavior baseline with the `regression-tests` skill (recorded outputs on a representative corpus). Add `benchmark` baselines if performance matters.
- Fill coverage gaps on the riskiest call sites with characterization tests.

## 4. Strategy
Prefer incremental over big bang:
- Strangler: route one module/endpoint/feature at a time to the new implementation behind an adapter, flag or facade, while the rest keeps running on the old one.
- Compatibility shims/adapters so old and new can coexist during the transition.
- For version bumps: upgrade through intermediate major versions one at a time; fix deprecations on the old version first.
- Each increment must leave the build and tests green.

## 5. Write the checklist
Create `MIGRATION.md` at the repo root with ordered, independently verifiable items, one per increment:
```
# Migration: <from> -> <to>
## Checklist
- [ ] Fix deprecation warnings on current version in module A
- [ ] Bump dependency X to 3.x and adapt call sites in src/foo
- [ ] Port module B behind the adapter
- [ ] Remove compatibility shim
## Rollback
<how to revert each phase>
```
Each item must be small enough for one iteration. The `migrate-step` loop (`workflow-generator loop migrate-step`) takes the next `- [ ]` item, implements it, runs tests and checks it off; it stops when no `- [ ]` remain. Only check an item when its verification passes.

## 6. Execute each item
1. Implement the change for that item only.
2. Run `{{commands.build}}`, `{{commands.typecheck}}`, `{{commands.test}}`, and compare against the regression baseline.
3. Check the box `- [x]` and leave the tree commit-ready.
4. If an item is too big, split it into new unchecked items instead of half-doing it.

## 7. Rollback plan
- Per phase: how to revert (git revert of the increment, feature flag off, keep the old artifact deployable, data migration down-scripts or backups).
- Irreversible steps (data format changes, schema drops) go last and need explicit user confirmation.

## Definition of done
- Every checklist item checked; shims and old code removed.
- Regression baseline shows no unexplained differences; explained ones are documented.
- Commands in `.harness/harness.json` updated if tooling changed (`workflow-generator detect`, then `sync`).
- Lessons in `.harness/memory/lessons.md`; decisions in `decisions.md`; `architecture.md` updated.

## Pitfalls
- Upgrading everything at once and debugging hundreds of errors with no baseline.
- Mixing feature work into migration increments.
- Checking items off before tests pass.
- Forgetting CI images, Dockerfiles and toolchain version files.
