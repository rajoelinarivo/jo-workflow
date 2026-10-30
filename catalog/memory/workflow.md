---
title: Workflow
order: 30
load: always
---
# Workflow

## Plan before code
For any change beyond a trivial fix: read the relevant memory and code, state the goal and acceptance criteria, write a short step plan, and confirm it with the user when the change is non-trivial or the scope is unclear. Ask before expanding scope.

## Which skill for which situation
- A whole task from request to done, or resuming one: `dev` (orchestrator, picks a workflow from `.harness/workflows/`)
- New project or module from scratch: `project-bootstrap`
- Build a feature or user story: `implement-feature`
- Generate code from a spec, schema or templates: `code-generation`
- Choose between libraries, tools or designs: `solution-research`
- Bug, crash, failing or flaky test: `bug-hunt`
- Restructure code without changing behavior: `refactor`
- Framework, language, version or infrastructure change: `migration`
- Unit tests for logic: `unit-tests`
- Tests with real DB, HTTP, queues: `integration-tests`
- Snapshot / golden-file output tests: `golden-tests`
- Before/after behavior baseline for migrations and refactors: `regression-tests`
- Performance measurement and comparison: `benchmark`
- Review a diff before merging: `code-review`
- Secrets, injection, authz, vulnerable dependencies: `security-audit`
- README, API docs, changelog, architecture: `documentation`
- Record a decision, lesson or convention: `remember`
- Change the harness itself (skills, agents, hooks, loops, commands): `harness-maintenance`

## Definition of done
- Acceptance criteria met and covered by tests.
- `{{commands.build}}`, `{{commands.lint}}`, `{{commands.typecheck}}` and `{{commands.test}}` pass (skip only commands that are not configured, and say so).
- No unrelated changes, no debug leftovers, no secrets.
- Docs and changelog updated when behavior is user-visible.
- Memory updated (see below).
- Final message states what changed, how it was verified, and anything left open.

## Loops
Autonomous loops run headless until a check passes: `jo-workflow loop <name>`.
- `fix-until-green`: fix failing tests until `{{commands.test}}` passes.
- `lint-clean`: fix lint errors until `{{commands.lint}}` passes.
- `typecheck-clean`: fix type errors until `{{commands.typecheck}}` passes.
- `migrate-step`: work through `MIGRATION.md` one unchecked item at a time.

## Memory
`.harness/memory/` is the project's long-term memory and the source of truth for these instructions. Update it in the same task when something durable appears:
- A decision with alternatives -> `decisions.md` (dated ADR).
- A trap, gotcha or debugging insight -> `lessons.md`.
- A coding rule -> `conventions.md`.
- A structural change -> `architecture.md`.
- Project facts or commands -> `project.md` / `.harness/harness.json`.
Never store secrets. Never edit generated files (`CLAUDE.md`, `AGENTS.md`, `.claude/`, `.agents/`, `.opencode/`, `.codex/`); edit `.harness/` and run `jo-workflow sync`.
