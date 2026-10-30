---
name: implement-feature
description: "Implement a feature end to end: plan, split into small verifiable steps, write tests, implement, verify with build/lint/typecheck/tests, then self-review. Asks before expanding scope. Use when the user says implement, add a feature, build this, add support for, create an endpoint/command/screen, or hands over a user story or ticket."
category: implementation
user-invocable: true
argument-hint: "[feature description or ticket]"
---
# Implement a feature

## 1. Understand
- Restate the feature in 2–4 sentences: inputs, outputs, users, acceptance criteria. If acceptance criteria are missing, propose them and confirm.
- Read `.jow/memory/conventions.md`, `.jow/memory/architecture.md` and the relevant `decisions.md` entries.
- Locate the code that will change: entry points, similar existing features to copy patterns from, tests that cover the area.
- List open questions. Ask the ones that change the design; make and state assumptions for the rest.

## 2. Plan (before writing code)
Write a short plan in the conversation:
- Files to create or modify and why.
- Ordered steps, each small enough to build and test on its own (target: under ~100 changed lines per step).
- Tests to add per step (unit for logic, integration for wiring, golden for output formats).
- Risks: data migrations, public API changes, performance, security-sensitive input.
For non-trivial work, get the plan confirmed before coding. Delegate to the `planner` agent if available for large features.

## 3. Execute step by step
For each step:
1. Write or update the test that expresses the step's behavior; watch it fail for the right reason.
2. Implement the minimum to make it pass, following existing conventions (naming, error handling, logging, layering).
3. Run `{{commands.test-unit}}` (or `{{commands.test}}`) and `{{commands.lint}}`. Fix before moving on.
4. Keep the tree in a working state; each step should be commit-ready.

## 4. Scope control
- Anything not in the acceptance criteria is scope creep: unrelated refactors, extra options, "while I'm here" fixes.
- Stop and ask before doing it. Offer to note it as a follow-up instead.
- If a refactor is required to implement cleanly, do it as a separate preceding step using the `refactor` skill, with no behavior change.

## 5. Verify
Run the full chain and fix every failure:
- `{{commands.build}}`
- `{{commands.lint}}`
- `{{commands.typecheck}}`
- `{{commands.test}}`
- `{{commands.test-integration}}` if the feature touches I/O, persistence or external services.
Exercise the feature once manually (run the CLI, call the endpoint, open the screen) when feasible.

## 6. Self-review
Apply the `code-review` skill to your own diff: correctness, edge cases, error paths, security of inputs, tests meaningful, no debug leftovers, docs updated (`documentation` skill if user-facing behavior changed).

## Definition of done
- All acceptance criteria met and each covered by at least one test.
- Build, lint, typecheck and tests green.
- No unrelated changes in the diff.
- Docs and changelog updated if behavior is user-visible.
- Design decisions recorded in `.jow/memory/decisions.md`; surprises or gotchas in `.jow/memory/lessons.md`.

## Pitfalls
- Coding before the plan: leads to rewrites and oversized diffs.
- Tests written after the fact that only mirror the implementation.
- Silently changing public interfaces or data formats. Flag them explicitly.
- Leaving TODOs without telling the user.
