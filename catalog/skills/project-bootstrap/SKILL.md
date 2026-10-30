---
name: project-bootstrap
description: "Start a new project or module from zero: clarify the goal, choose a stack with written justification, scaffold a minimal runnable skeleton, wire up test/lint/format, and fill the harness project memory and commands. Use when the user says start a new project, bootstrap, scaffold, init a repo, create a new service/module/package, or set up a project from scratch."
category: creation
user-invocable: true
argument-hint: "[project goal or module name]"
---
# Project bootstrap

Goal: a minimal skeleton that installs, builds, runs, tests and lints with one command each, and a harness that knows those commands.

## 1. Clarify before choosing anything
Ask (or infer from the request and state your assumptions):
- What does it do, for whom, and what is the first usable increment?
- Runtime constraints: target platform (server, CLI, browser, mobile, embedded), deployment target, performance or memory limits.
- Team constraints: languages the team already maintains, existing services to integrate with, licensing.
- Is this a new repo or a new module inside an existing one? If inside, reuse the existing stack, layout and tooling unless there is a stated reason not to.

Do not scaffold until the goal and the first increment fit in two sentences.

## 2. Choose the stack
- List 2–3 candidate stacks. Compare on: fit to the problem, team familiarity, ecosystem maturity, build/test tooling, deployment fit.
- Prefer the boring, well-supported option. Pick the official or most widely used project generator for that ecosystem (e.g. the language's package manager init command or framework CLI).
- Write the choice and its justification as an ADR in `.harness/memory/decisions.md` (date, context, decision, alternatives, consequences). For a deep comparison use the `solution-research` skill first.

## 3. Scaffold the minimal skeleton
- Generate with the ecosystem's standard tool, then trim anything not needed for the first increment.
- Standard layout for the ecosystem: source dir, test dir, a single entry point, a dependency manifest with pinned or locked versions (commit the lockfile).
- Add `.gitignore` for the stack, build outputs, local env files and secrets. Add a `.env.example` if configuration is needed; never commit real secrets.
- One trivial feature end to end (e.g. a health endpoint, a `--version` flag, a hello function) so there is something real to test.

## 4. Quality tooling
- Test runner with one passing unit test for the trivial feature.
- Linter and formatter using the ecosystem defaults; configure, do not invent a style.
- Type checker if the language supports one optionally (static analysis, type hints, strict compiler flags).
- Optional: a CI workflow that runs install, build, lint, typecheck, test.
- Separate unit and integration test commands if the stack makes it easy; otherwise leave them empty.

## 5. Register the harness
- Fill `.harness/memory/project.md`: purpose, users, stack, entry points, how to run locally, external dependencies. Replace every TODO you can answer; leave the rest explicit.
- Set the commands in `.harness/harness.json` (`install`, `build`, `test`, `test-unit`, `test-integration`, `lint`, `typecheck`, `format`, `bench`). Run `jo-workflow detect` to propose them from the detected stack, review the result, then run `jo-workflow sync` to regenerate the per-system files.
- Record stack-specific conventions (naming, layout, error handling) in `.harness/memory/conventions.md`.

## 6. Verify
Run in order and fix until each succeeds on a clean checkout:
1. `{{commands.install}}`
2. `{{commands.build}}`
3. `{{commands.lint}}`
4. `{{commands.typecheck}}`
5. `{{commands.test}}`

## Definition of done
- A fresh clone runs every configured command successfully.
- One real behavior is implemented and tested.
- Stack ADR recorded; project.md and harness.json commands filled; `jo-workflow sync` run.
- No secrets, no generated build artifacts committed.

## Pitfalls
- Over-scaffolding: auth, ORM, queues and Docker before the first feature exists. Add them when a feature needs them.
- Choosing a stack for novelty. Justify against the criteria, not taste.
- Unpinned dependencies or a missing lockfile: builds drift.
- Forgetting to sync after editing `.harness/`: the agent systems keep stale commands.
