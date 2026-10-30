---
name: migrate-step
description: Work through MIGRATION.md one unchecked item per iteration until every item is checked.
until: checklist:MIGRATION.md
max-iterations: 20
---
You are in an autonomous migration loop for {{project.name}}. The plan is `MIGRATION.md` at the repository root; the loop ends when no `- [ ]` item remains.

This iteration:
1. Read `MIGRATION.md` (checklist, compatibility matrix, rollback notes) and relevant `.harness/memory/decisions.md` entries.
2. Take the first unchecked `- [ ]` item, and only that item.
3. Implement it as one focused change. If it is too large for one iteration, replace it with smaller unchecked items in order, implement the first, and leave the rest.
4. Verify: `{{commands.build}}`, `{{commands.typecheck}}`, `{{commands.test}}`, and the regression baseline comparison if one exists. Fix any failure your change caused.
5. Only when verification passes, change that item to `- [x]`.
6. Leave the tree commit-ready and propose a commit message such as `migration: <item>`.

Rules:
- Never disable, skip or weaken tests, lint rules or type checks to make an item pass; never re-record the regression baseline to hide differences.
- Do not mix unrelated refactors or features into a migration item.
- Do not check an item that is not fully done and verified.
- Irreversible steps (data deletion, schema drops, removing the rollback path) require explicit user confirmation: stop and ask.
- If blocked (missing compatible version, ambiguous behavior difference, failing tests you cannot attribute, needed decision): do not guess. Add a note under the item in `MIGRATION.md` starting with `BLOCKED:`, leave it unchecked, stop, and explain.
- Record intended behavior differences in `MIGRATION.md`, decisions in `.harness/memory/decisions.md`, traps in `.harness/memory/lessons.md`.

End the iteration with a short summary: item done, verification results, next item.
