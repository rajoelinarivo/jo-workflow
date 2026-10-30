---
name: migration
description: Migrate a framework, language, runtime or library version, database or infrastructure incrementally, with a behavior baseline and a rollback plan.
---
# Migration

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Inventory
- Use: skill `migration`; agent `researcher` for release notes, breaking changes and compatibility.
- Done when: affected areas, breaking changes and a compatibility matrix are written down.

## 2. Baseline
- Use: skill `regression-tests`, skill `benchmark` when performance matters.
- Done when: current behavior (and performance) is recorded and reproducible.
- Check: test

## 3. Plan [gate]
- Use: skill `migration`, agent `planner`.
- Do: write `MIGRATION.md` as a `- [ ]` checklist of small increments plus a rollback plan; record the decision in `decisions.md`.
- Done when: `MIGRATION.md` exists and is approved.

## 4. Migrate increments
- Use: skill `migration`. For a long mechanical checklist, suggest `workflow-generator loop migrate-step`.
- Do: one checklist item at a time, tree working after each.
- Check: build, test after every item

## 5. Compare with the baseline
- Use: skill `regression-tests`, skill `benchmark`.
- Done when: every difference is explained or fixed.
- Check: test, test-integration, bench (if a baseline exists)

## 6. Review and close [gate]
- Use: agent `reviewer`, skill `documentation`, skill `remember`.
- Done when: docs and memory updated, rollback notes final, Summary written.
