---
name: remember
description: "Record a durable fact into the right .harness/memory file so future sessions know it: decisions as dated ADRs in decisions.md, gotchas and lessons in lessons.md, conventions in conventions.md, structure in architecture.md, project facts in project.md. Keeps entries short and never stores secrets. Use when the user says remember this, note that, from now on, always/never do X, we decided, lesson learned, add to memory, or when a session uncovers a decision, convention or trap worth keeping."
category: memory
user-invocable: true
argument-hint: "[fact, decision or lesson to remember]"
---
# Remember

Memory lives in `.harness/memory/*.md`. It is loaded into future sessions (files with `load: always`) or linked (`load: reference`). Only durable, project-specific knowledge belongs there.

## 1. Decide if it is worth storing
Store it if it is:
- true beyond this session, and
- not obvious from the code, config or git history, and
- likely to change how someone works next time.
Do not store: transient task status, things already in the code or README, personal preferences unrelated to the project, guesses.

## 2. Pick the file
| Kind of fact | File | Format |
|---|---|---|
| Decision with alternatives (library choice, architecture, policy, accepted risk) | `decisions.md` | ADR entry |
| Gotcha, trap, surprising behavior, debugging insight | `lessons.md` | one dated line |
| Rule for how code is written (naming, layout, error handling, test patterns, commands to use) | `conventions.md` | bullet under the right section |
| Components, data flow, integrations, deployment | `architecture.md` | update the relevant section |
| Project identity, purpose, stack, how to run | `project.md` | update the field |
If two files seem to fit, prefer the more specific one and do not duplicate.

## 3. Write the entry
**decisions.md** (append, increment the number):
```
## ADR-007: Use PostgreSQL advisory locks for job scheduling (2026-03-14)
Status: accepted
Context: two workers picked the same job under load.
Decision: acquire an advisory lock per job id before processing.
Alternatives: queue service (extra infra), row-level locks (deadlocks observed).
Consequences: jobs require a DB connection for their duration.
```
**lessons.md** (append):
`- 2026-03-14 — The test DB container needs 5s after "ready" before migrations succeed; wait on a real query (integration tests)`
**conventions.md**: one imperative bullet, e.g. `- Return domain errors, never raw driver errors, from repositories.`

Use today's date in `YYYY-MM-DD`. Keep each entry to a few lines; link to files or docs for detail.

## 4. Maintain
- Before adding, search the file for an existing entry; update it instead of duplicating.
- If a new decision replaces an old one, mark the old ADR `Status: superseded by ADR-NNN`; do not delete history.
- Remove lessons that no longer apply (the trap was fixed at the root) and say so in the change summary.
- `.harness/memory/` is the source of truth. Do not edit CLAUDE.md, AGENTS.md or other generated copies; run `jo-workflow sync` after editing if the rendered instructions must update now.

## 5. Never store
- Secrets, tokens, passwords, private keys, connection strings with credentials.
- Personal data about users or customers.
- Internal URLs or hostnames the user did not ask to record.
If a fact requires a secret, store where it lives (e.g. "API key in the vault under X"), not its value.

## Definition of done
- Entry in the correct file, in the file's format, dated where required.
- No duplicates, no secrets.
- Tell the user in one line what was recorded and where.

## Pitfalls
- Dumping session logs into memory: it bloats every future context.
- Vague lessons ("be careful with dates"); state the concrete trap and the fix.
