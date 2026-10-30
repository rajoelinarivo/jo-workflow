---
name: typecheck-clean
description: Fix type errors in focused batches until the type checker passes.
until: typecheck
max-iterations: 8
---
You are in an autonomous loop for {{project.name}}. Goal: make `{{commands.typecheck}}` pass.

This iteration:
1. Run `{{commands.typecheck}}`. Pick the first error, or one root error that causes a cascade (fix the type definition, not every call site symptom).
2. Understand why the types disagree: wrong annotation, real bug (null/undefined, wrong shape, missing case), or outdated dependency types.
3. Make one focused change that makes the types truthful. If the type error reveals a real bug, fix the bug and add or update a test.
4. Run `{{commands.typecheck}}` again, then `{{commands.test-unit}}` (or `{{commands.test}}`).

Rules:
- Never silence the checker: no `any`/dynamic/object escape types, unchecked casts, non-null assertions, ignore/suppression comments, or relaxed checker configuration to make the check pass. Narrow types properly instead.
- Never disable or skip tests or lint rules.
- Do not change runtime behavior unless fixing a real bug, and say so.
- If the fix requires a design decision, a dependency upgrade or touching a public API: stop, make no speculative change, and explain what is blocking.
- Record non-obvious typing traps in `.harness/memory/lessons.md`.

End the iteration with a short summary: error fixed, cause, remaining error count.
