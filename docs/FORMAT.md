# Neutral harness format

A project managed by `workflow-generator` keeps the **single source of truth** of its
agent harness in `.harness/`. `workflow-generator sync` renders it into the files each
enabled system reads (Claude Code, OpenCode, Codex). Edit `.harness/`, then sync.

```
.harness/
  harness.json          manifest: systems, stack, commands, permissions
  lock.json             generated files and their hashes, catalog versions of installed
                        items (commit it, do not edit)
  overrides/<path>      verbatim replacement for the generated file <path> (see adopt)
  memory/*.md           project knowledge loaded into every session
  skills/<name>/SKILL.md (+ any supporting files)
  agents/<name>.md      subagents
  hooks/<name>/hook.json + run.mjs
  loops/<name>.md       autonomous iterations run headless until a condition holds
  workflows/<name>.md   phases the `dev` orchestrator runs for one kind of task
  work/<date>-<slug>.md state of each task run by the orchestrator (versioned)
  runtime/              generator-owned helpers (bridge, loop runner) - do not edit
```

## Orchestrator and workflows

The `dev` skill is the entry point: `/dev <request>` (Codex: `$dev <request>`). It
classifies the request, picks a workflow, creates `.harness/work/<date>-<slug>.md` and runs
the workflow phases through the other skills and agents. Skills stay usable directly.

`harness.json`:

```json
"orchestrator": { "trigger": "auto", "autonomy": "guided" }
```

- `trigger`: `auto` = the generated instructions route every development request through
  `dev`; `manual` = only `/dev`.
- `autonomy`: `guided` = stop at phases marked `[gate]`; `step` = stop after each phase;
  `auto` = stop only when blocked.

`workflows/<name>.md` is read by the agent directly (no placeholders):

```markdown
---
name: bugfix
description: Diagnose and fix a bug with a regression test.
---
## 1. Reproduce
- Use: skill `bug-hunt`; agent `debugger`
- Do: ...
- Done when: ...

## 3. Root cause [gate]
- Check: test, lint          # project command names from harness.json
```

Extra placeholders: `{{harness.workflows}}` (table of installed workflows),
`{{orchestrator.autonomy}}`, `{{orchestrator.trigger}}`.

## Upgrade and adopt

- `upgrade` replaces an installed item with the current catalog version only when the
  item still equals the catalog version it was installed from (`lock.json` `catalog`).
  Items changed in `.harness/` are kept unless `--force`.
- `adopt <file>` keeps a hand edit of a generated file. Skill files and agent files
  (Claude, OpenCode or Codex flavor) are written back into their `.harness/` source:
  body, description, argument hint and tools, with placeholders restored where the
  source used them. `.codex/config.toml`, or any file with `--override`, is copied to
  `overrides/<path>` and from then on generated verbatim.

## Placeholders

Any `.md` file may use `{{commands.<key>}}` (from `harness.json` `commands`) and
`{{project.name}}`. At sync, an empty or missing command renders as
`the project's <key> command (see project memory)`.

## harness.json

```json
{
  "version": 1,
  "name": "my-app",
  "systems": ["claude", "opencode", "codex"],
  "stack": ["node"],
  "commands": {
    "install": "npm install",
    "build": "npm run build",
    "test": "npm test",
    "test-unit": "",
    "test-integration": "",
    "lint": "npm run lint",
    "typecheck": "",
    "format": "",
    "bench": ""
  },
  "formatters": { "*.ts": "npx prettier --write {file}" },
  "permissions": {
    "allow-shell": ["git status", "git diff", "git log"],
    "deny-read": [".env", ".env.*", "secrets/**"]
  }
}
```

## memory/*.md

```markdown
---
title: Conventions
order: 20          # position in the rendered instructions file
load: always       # always = included in every session; reference = only linked
---
Markdown content.
```

Agents are told to keep these files up to date (decisions, lessons learned).

## skills/<name>/SKILL.md

```markdown
---
name: bug-hunt                      # lowercase, digits, hyphens; equals the folder name
description: What it does and when to use it, with trigger phrases. Max 1024 chars.
category: debug                     # free label used by `list`
user-invocable: true                # also expose it as a /bug-hunt command
argument-hint: "[symptom or failing test]"   # quote it: [a, b] would parse as a list
---
Instructions in Markdown. Other files in the folder are copied as-is.
```

## agents/<name>.md

```markdown
---
name: reviewer
description: When the main agent should delegate to this subagent.
tools: [read, search, shell]        # read, search, edit, write, shell, web
---
System prompt in Markdown.
```

## hooks/<name>/hook.json + run.mjs

```json
{
  "description": "Format files after the agent edits them",
  "event": "after-edit",
  "blocking": false,
  "timeout": 60
}
```

Events: `session-start`, `prompt-submit`, `before-edit`, `after-edit`,
`before-shell`, `after-shell`, `stop`.

`run.mjs` is run with Node. It receives on stdin one JSON object, the same whatever
the system:

```json
{ "event": "after-edit", "system": "claude", "cwd": "/abs/project",
  "tool": "edit", "files": ["src/a.ts"], "command": null, "prompt": null }
```

- exit 0: success. For `session-start` and `prompt-submit`, stdout is added to the
  agent's context.
- exit 2 (only when `blocking: true`): the action is blocked and stderr is shown to the
  agent as the reason. For `stop`, the agent is asked to continue with stderr as the
  instruction.
- any other exit code: non-blocking error, logged.

## loops/<name>.md

```markdown
---
name: fix-until-green
description: Fix failing tests one at a time until the suite passes.
until: test                         # a key of harness.json commands, or a shell command
max-iterations: 10
---
Prompt sent to the agent at each iteration.
```

`workflow-generator loop <name> [--system claude|opencode|codex] [--max N]` runs the
agent headless with the prompt, then the `until` command; it stops when that command
exits 0 or after `max-iterations`.
