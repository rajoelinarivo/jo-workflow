---
name: refactor
description: "Restructure code without changing its behavior: pin current behavior with characterization tests, then apply small behavior-preserving steps, one kind of refactoring per commit, running tests after each step, never mixing in feature changes. Use when the user says refactor, clean up, restructure, extract, rename, simplify, decouple, reduce duplication, split this file/class/module, or pay down tech debt."
category: refactor
user-invocable: true
argument-hint: "[code area and refactoring goal]"
---
# Refactor

Rule: behavior after == behavior before. If behavior must change, that is a separate task.

## 1. Define the goal
- State what is wrong (duplication, long function, tangled dependency, unclear names, hard to test) and what the target shape is.
- Define the boundary: which files/modules are in scope. Everything else is out.
- Check `.jow/memory/conventions.md` and `architecture.md` so the target shape matches the project.

## 2. Pin behavior (characterization tests)
- Run `{{commands.test}}` and confirm green before touching anything. If red, stop and report; do not refactor on a red baseline.
- Check coverage of the area. Where behavior is untested, write characterization tests that assert what the code does today (including odd behavior), not what it should do.
- For wide refactors or output-heavy code, add golden or regression baselines (see `golden-tests`, `regression-tests`).
- Public interfaces used by other modules or external clients must stay compatible unless the user explicitly agrees.

## 3. Plan the steps
List the sequence of named refactorings, e.g.:
- rename, extract function/method, inline, move, extract module/class, introduce parameter object, replace conditional with polymorphism, split phase, remove dead code.
Each step must be small, mechanical and independently verifiable. Prefer IDE/language-server automated refactorings when available.

## 4. Execute
For each step:
1. Apply exactly one kind of refactoring.
2. Run `{{commands.build}}` and `{{commands.test-unit}}` (or `{{commands.test}}`).
3. Green: the step is commit-ready; suggest a commit message like `refactor: extract parseHeader from Reader`.
4. Red: revert the step rather than debugging forward; make it smaller and retry.
Do not mix formatting-only changes with structural ones; they hide real diffs.

## 5. Guardrails
- No feature changes, no bug fixes mixed in. If you find a bug, note it, keep the behavior, and report it (fix later with `bug-hunt`). A characterization test can document it.
- No dependency upgrades during a refactor.
- Do not change tests and production code in the same step, except for renames the tests follow mechanically.
- If the scope grows beyond the plan, stop and ask.

## 6. Verify
- `{{commands.lint}}`, `{{commands.typecheck}}`, `{{commands.test}}`, and `{{commands.test-integration}}` if wiring moved.
- Compare regression baselines if you created them; there must be no diff.
- For performance-sensitive code, run `{{commands.bench}}` and compare (see `benchmark`).

## Definition of done
- Target shape reached; all tests and baselines unchanged and green.
- Diff contains only structural changes, split into steps of one refactoring kind each.
- Found bugs reported, not silently fixed.
- New structural conventions recorded in `.jow/memory/conventions.md`; non-obvious traps in `lessons.md`.

## Pitfalls
- Big-bang rewrites labeled as refactors.
- Characterization tests coupled to internals you are about to move: test through stable interfaces.
- Renaming across string-based lookups (reflection, config keys, serialization names, templates) that the compiler cannot see. Grep for them.
