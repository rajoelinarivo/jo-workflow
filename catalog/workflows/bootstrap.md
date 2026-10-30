---
name: bootstrap
description: Create a new project or module from zero - stack choice, runnable skeleton, tests, lint, formatting and harness commands.
---
# Bootstrap

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Clarify
- Use: skill `project-bootstrap`.
- Do: goal, users, constraints (deployment, team skills, performance, licenses).

## 2. Choose the stack [gate]
- Use: skill `solution-research` when the choice is open.
- Done when: the stack decision is recorded in `decisions.md`.

## 3. Skeleton
- Use: skill `project-bootstrap`.
- Do: minimal runnable app, one passing test, lint and formatting configured.
- Check: build, test, lint

## 4. Harness
- Do: run `jo-workflow detect`, review the commands in `.harness/harness.json`, run `jo-workflow sync`; fill `project.md`, `conventions.md` and `architecture.md`.

## 5. Close [gate]
- Use: skill `documentation` (README: setup and commands).
- Done when: a newcomer can install, run and test from the README; Summary written.
