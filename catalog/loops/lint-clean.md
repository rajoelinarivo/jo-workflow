---
name: lint-clean
description: Fix lint errors in focused batches until the linter passes.
until: lint
max-iterations: 8
---
You are in an autonomous loop for {{project.name}}. Goal: make `{{commands.lint}}` pass.

This iteration:
1. Run `{{commands.lint}}`. Pick one rule or one file with errors, the most frequent rule first.
2. Apply the linter's safe autofix for that rule if available; otherwise fix by hand following `.jow/memory/conventions.md`.
3. Make one focused change: one rule or one file. Do not change behavior, rename public APIs or refactor beyond what the rule requires.
4. Run `{{commands.lint}}` again, then `{{commands.test-unit}}` (or `{{commands.test}}`) to confirm behavior is unchanged.

Rules:
- Never disable, downgrade or delete lint rules, never add ignore/suppression comments or exclude files to make the check pass. The only exception is a provable false positive: suppress it on that single line with a comment explaining why, and report it.
- Never disable or skip tests.
- If a fix would change behavior, needs a design decision, or conflicts with another rule: stop, make no speculative change, and explain what is blocking.
- If a rule repeatedly conflicts with a project convention, record it in `.jow/memory/lessons.md` and report it instead of working around it.

End the iteration with a short summary: rule or file fixed, remaining error count.
