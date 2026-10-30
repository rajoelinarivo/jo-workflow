---
name: dev
description: "Development orchestrator and default entry point: classifies the request, picks the matching workflow from .harness/workflows/, tracks the task in .harness/work/, and drives it phase by phase through the project's skills and subagents with approval gates, verification and memory updates. Use for /dev, for any development request that does not name a specific skill, or to resume a task in progress."
category: orchestration
user-invocable: true
argument-hint: "[what to do, or nothing to resume]"
---
# Dev orchestrator

You drive the task from start to finish; skills and subagents do the specialized work.
Autonomy for this project: **{{orchestrator.autonomy}}**.

## 0. Resume or start
- Look in `.harness/work/` for task files with `status: in-progress` or `status: blocked`.
- If the request is empty, says "resume"/"continue", or clearly matches an open task: open that file, read Phases, Decisions and Log, and continue at the first unchecked phase. Re-run the last phase's checks first: the code may have changed since.
- Several open tasks and the request does not say which: list them (title, workflow, next phase) and ask.
- A new request while a task is open: ask whether to pause the open task (set `status: blocked` with the reason) or finish it first.

## 1. Classify
Pick exactly one workflow by intent, not by keywords:

{{harness.workflows}}

- Tiny, low-risk change with no design question (typo, rename, config value, one-line fix): `quick`.
- A request mixing several kinds of work: split it into tasks, propose an order, run them one after the other.
- Nothing fits: take the closest workflow and say which phases you adapt, or ask.
- A plain question about the code needs no workflow: just answer it.

Say it in one line: `Workflow: <name> - <reason>`.

## 2. Open the task file
Create `.harness/work/<YYYY-MM-DD>-<short-slug>.md` from the template below. Copy the workflow's phases into the Phases checklist. This file is the shared state across sessions, tools and teammates (it is versioned): keep it current after every phase.

## 3. Run the phases
Read `.harness/workflows/<name>.md`, then for each phase in order:
1. Announce `Phase <n>/<total>: <name>`.
2. Load the skills listed under **Use**. Delegate to a listed subagent when the phase is large or benefits from a fresh context (planner, test-writer, reviewer, researcher, debugger). Give it the task file path, the exact scope and the expected output; you stay responsible for the result and check it.
3. Do the work until the phase's **Done when** holds. Run its **Check** commands: check names (`test`, `lint`, `typecheck`, `build`, `test-unit`, `test-integration`, `bench`) are the project commands listed in project memory and `.harness/harness.json`. Skip a command that is not configured and say so.
4. Update the task file: tick the phase, add one Log line (what was done, result, files), record decisions.
5. Gates, depending on autonomy:
   - `guided`: stop after phases marked `[gate]`; summarize and wait for approval.
   - `step`: stop after every phase.
   - `auto`: do not stop at gates.
   Whatever the autonomy, stop and ask when: requirements are ambiguous, an action is destructive or irreversible, the scope grows, a security-sensitive choice appears, or the same check fails three times on the same problem.

## 4. When a check fails
Go back to the phase that produced the code, fix the root cause, re-run the check. Never skip, disable or weaken tests, lint rules or type checks. If the remaining work is long and mechanical, suggest the matching loop to the user (`jo-workflow loop fix-until-green`, `lint-clean`, `typecheck-clean`, `migrate-step`).

## 5. Close
1. Check the Definition of done from project memory.
2. Record durable knowledge with the `remember` skill: decisions in `decisions.md`, traps in `lessons.md`, new rules in `conventions.md`.
3. Set `status: done`, update `updated`, write the Summary.
4. Final message: what changed, how it was verified, follow-ups. Do not commit or push unless the user asks.

## Direct use of other skills
When the user invokes a specific skill, command or subagent directly (`/bug-hunt`, `/refactor`, the reviewer...), do only that: no orchestration, no task file unless asked.

## Task file template
```markdown
---
task: <slug>
workflow: <name>
status: in-progress
autonomy: {{orchestrator.autonomy}}
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
# <title>

## Request
<the user's request, verbatim>

## Acceptance criteria
- <observable result>

## Phases
- [ ] 1. <phase name>

## Decisions
- <decision> - <why>

## Log
- YYYY-MM-DD phase <n>: <what was done, result, files>

## Summary
<written when done: what changed, how it was verified, follow-ups>
```
`status` is `in-progress`, `blocked` (say why in the Log) or `done`.
