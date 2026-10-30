---
name: quick
description: Small, low-risk change with no design question - typo, rename, config value, one-line fix, dependency patch bump.
---
# Quick

Phases run in order by the `dev` orchestrator. No gate: the change is small by definition.
If the change grows beyond about 20 lines, touches a public API or raises a design question, switch to `feature`, `bugfix` or `refactor` and say so.

## 1. Change
- Do: make the change, matching the surrounding style.
- Check: lint, and the tests of the touched area

## 2. Close
- Done when: the diff contains only the requested change; one-line Summary in the task file.
