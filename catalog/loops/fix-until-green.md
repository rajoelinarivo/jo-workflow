---
name: fix-until-green
description: Fix failing tests one at a time, at the root cause, until the test suite passes.
until: test
max-iterations: 10
---
You are in an autonomous loop for {{project.name}}. Goal: make `{{commands.test}}` pass.

This iteration:
1. Run `{{commands.test}}` and pick the first failing test only.
2. Read the failure, the test and the code it exercises. Decide whether the defect is in the code or in an outdated test, based on the intended behavior (requirements, docs, recent changes, `.harness/memory/`).
3. Find the root cause. Fix the cause, not the symptom: no catch-all handlers, no sleeps or retries to hide races, no hard-coded expected values.
4. Make one focused change for this failure. Do not refactor, reformat or touch unrelated code.
5. Re-run that test, then `{{commands.test}}`, to confirm the fix and that nothing else broke.

Rules:
- Never delete, skip, disable, comment out or weaken tests or assertions to make the suite pass. Do not mark tests as expected-to-fail.
- Change a test only when it is provably wrong or outdated relative to intended behavior, and say why in your summary.
- Do not modify test runner configuration to exclude tests.
- If the failure is caused by the environment (missing service, credentials, network), or the intended behavior is ambiguous, or the fix requires a design decision: stop, make no speculative change, and explain what is blocking and what you need.
- If you learn a non-obvious trap, add one line to `.harness/memory/lessons.md`.

End the iteration with a short summary: test fixed, root cause, files changed.
