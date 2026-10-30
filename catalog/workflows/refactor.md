---
name: refactor
description: Restructure code without changing behavior - extract, rename, split, simplify, remove duplication - guarded by characterization tests.
---
# Refactor

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Scope
- Use: skill `refactor`.
- Do: state the target structure and why; list what must not change (public API, outputs, performance).
- Done when: scope and invariants are in the task file.

## 2. Safety net
- Use: skill `refactor` (characterization tests), skill `regression-tests` or `golden-tests` for output-heavy code.
- Done when: the behavior of the area is pinned by passing tests.
- Check: test

## 3. Plan [gate]
- Use: agent `planner` for large refactors.
- Done when: ordered behavior-preserving steps, one kind of refactoring each.

## 4. Refactor in steps
- Use: skill `refactor`.
- Do: one step, run tests, next step. No feature or bug changes mixed in.
- Check: test, lint after every step

## 5. Verify and review [gate]
- Use: agent `reviewer`.
- Check: build, typecheck, test, bench (if performance is an invariant)
- Done when: no behavior change detected, review findings handled, Summary written.
