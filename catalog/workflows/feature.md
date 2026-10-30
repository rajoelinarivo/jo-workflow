---
name: feature
description: Build a new feature, user story or enhancement end to end, from acceptance criteria to reviewed, tested code.
---
# Feature

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Understand
- Use: skill `implement-feature` (Understand)
- Do: restate the goal, write acceptance criteria, read the relevant memory and code, list open questions.
- Done when: acceptance criteria are in the task file and blocking questions are answered.

## 2. Plan [gate]
- Use: agent `planner` for multi-file work, otherwise plan inline.
- Do: files to change, ordered small steps, tests per step, risks.
- Done when: the plan is in the task file.

## 3. Implement
- Use: skill `implement-feature` (Execute step by step), skill `unit-tests`; agent `test-writer` for a large test surface.
- Do: one step at a time, test first, keep the tree working after each step.
- Check: test-unit (or test), lint

## 4. Verify
- Use: skill `integration-tests` when the feature touches I/O, persistence or external services.
- Check: build, lint, typecheck, test, test-integration (if configured)

## 5. Review
- Use: agent `reviewer` (fresh context) or skill `code-review`.
- Do: fix high and medium findings, list the rest as follow-ups.
- Check: test

## 6. Document and close [gate]
- Use: skill `documentation` if user-visible behavior changed, skill `remember`.
- Done when: docs updated, decisions and lessons recorded, task Summary written.
