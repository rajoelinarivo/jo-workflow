---
name: harness-maintenance
description: "Explain and maintain the project's agent harness managed by jo-workflow: .harness/ is the single source of truth, generated files must never be edited, and skills, agents, hooks, memory and loops are added, removed, listed, synced and run through the jo-workflow CLI. Use when the user says add a skill/agent/hook/loop, remove a skill, update the harness, sync, harness status, detect commands, enable Codex/OpenCode/Claude, run a loop, or asks how the harness works."
category: harness
user-invocable: true
argument-hint: "[harness operation, e.g. add skill bug-hunt]"
---
# Harness maintenance

## How it works
- `.harness/` is the single source of truth:
  - `harness.json`: enabled systems, stack, commands, formatters, permissions
  - `memory/*.md`: project knowledge loaded into sessions
  - `skills/<name>/SKILL.md`, `agents/<name>.md`, `hooks/<name>/`, `loops/<name>.md`
  - `lock.json`: generated files and their hashes (commit it, never edit it)
  - `runtime/`: generator-owned helpers (never edit)
- `jo-workflow sync` renders `.harness/` into each enabled system's files.
- Generated files, never edit by hand: `.claude/`, `.agents/`, `.opencode/`, `.codex/`, `CLAUDE.md`, `AGENTS.md`. Edits there are overwritten on the next sync and are detected as drift by `status`.

## Commands
| Goal | Command |
|---|---|
| Add a catalog item | `jo-workflow add <skill\|agent\|hook\|memory\|loop\|workflow> <name>` |
| Remove an item | `jo-workflow remove <skill\|agent\|hook\|memory\|loop\|workflow> <name>` |
| List installed and available items | `jo-workflow list` |
| Regenerate system files from `.harness/` | `jo-workflow sync` |
| Show drift, missing or outdated generated files | `jo-workflow status` |
| Detect stack and propose commands | `jo-workflow detect` |
| Run an autonomous loop | `jo-workflow loop <name> [--system claude\|opencode\|codex] [--max N]` |
| Enable or disable a target system | `jo-workflow system add <claude\|opencode\|codex>` / `system remove <...>` |
| Update installed items from the generator catalog (keeps items you changed) | `jo-workflow upgrade [--dry-run]` |
| Keep a hand edit of a generated file | `jo-workflow adopt <file>... [--override]` |

## Procedures
**Change any instruction, skill or agent**
1. Edit the file under `.harness/`.
2. Run `jo-workflow sync`.
3. Run `jo-workflow status` and confirm no drift.

**Fix project commands**
1. Run `jo-workflow detect`; review the proposal against what actually works.
2. Edit `commands` in `.harness/harness.json` (install, build, test, test-unit, test-integration, lint, typecheck, format, bench). Leave a command empty rather than guessing.
3. Run each command once to confirm, then `jo-workflow sync`. Command placeholders in skills and memory render with the new values.

**Write a custom skill**
- Create `.harness/skills/<name>/SKILL.md`; `name` equals the folder name (lowercase, digits, single hyphens).
- Frontmatter: `name`, `description` (what it does and when to use it, with trigger phrases, max 1024 chars), `category`, `user-invocable`, `argument-hint`.
- Body: concrete steps, decision points, definition of done, pitfalls. Supporting files in the folder are copied as-is.

**Write a custom loop**
- `.harness/loops/<name>.md` with `name`, `description`, `until` (a commands key or a shell command; `checklist:<file>` means done when no `- [ ]` remain), `max-iterations`.
- The body is the prompt sent at each iteration: one focused change, never disable checks, stop and explain when blocked.

**Workflows and the dev orchestrator**
- `.harness/workflows/<name>.md`: `name`, `description` (what kind of task it handles), then one `## <n>. <Phase>` heading per phase with `- Use:` (skills, agents), `- Do:`, `- Check:` (project command names) and `- Done when:`. Append `[gate]` to a phase heading to stop there for approval in guided autonomy.
- The `dev` skill reads workflows directly from `.harness/workflows/`; run `jo-workflow sync` after adding one so the orchestrator's list is refreshed.
- `.harness/harness.json` `orchestrator`: `trigger` is `auto` (every development request goes through `dev`) or `manual` (only `/dev`); `autonomy` is `guided`, `step` or `auto`.
- Task state lives in `.harness/work/*.md` (versioned).

**Hooks**
- `.harness/hooks/<name>/hook.json` (description, event, blocking, timeout) and `run.mjs` (Node, reads one JSON object on stdin). Events: session-start, prompt-submit, before-edit, after-edit, before-shell, after-shell, stop. Exit 2 blocks only when `blocking: true`.

## Status drift
If `status` reports a modified generated file, someone edited output directly. Run `jo-workflow adopt <file>`:
- a skill or agent file goes back to its `.harness/` source (placeholders restored) and reaches every system; review with `git diff .harness`;
- `.codex/config.toml` becomes an override in `.harness/overrides/`;
- `AGENTS.md`, `CLAUDE.md` and other generated files are refused: port the change into `.harness/memory/` or the relevant source. `--override` freezes the file as-is, which also blocks future updates to it - use it only when the user asks.
Never adopt on your own initiative: ask the user whether the hand edit should be kept.

## Definition of done
- Change made in `.harness/` only; `sync` run; `status` clean.
- `.harness/lock.json` and generated files committed together with the source change.
- Notable harness decisions (systems enabled, permission policy) recorded in `.harness/memory/decisions.md`.

## Pitfalls
- Editing `CLAUDE.md` or `AGENTS.md` directly.
- Adding secrets to `harness.json` or memory; use `permissions.deny-read` to keep agents away from secret files.
- Forgetting `sync` after editing; the agents keep old instructions.
