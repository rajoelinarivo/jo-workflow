---
name: bugfix
description: Diagnose and fix a bug, crash, wrong output or failing or flaky test, with a regression test proving the fix.
---
# Bugfix

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Reproduce
- Use: skill `bug-hunt` (reproduce, minimal repro); agent `debugger` for hard or long investigations.
- Done when: the bug reproduces reliably, steps recorded in the task file. If it cannot be reproduced, stop and report what was tried.

## 2. Failing test
- Use: skill `bug-hunt`, skill `unit-tests` or `integration-tests`.
- Done when: a test fails for the reported reason.

## 3. Root cause [gate]
- Use: skill `bug-hunt` (isolate, bisect).
- Do: explain the root cause and the intended fix; flag any behavior or API change.
- Done when: root cause and fix plan are in the task file.

## 4. Fix
- Do: minimal fix of the cause, not the symptom.
- Check: the new test, then test, lint

## 5. Verify and review
- Use: skill `code-review` on the diff.
- Check: build, typecheck, test

## 6. Close
- Use: skill `remember` (lesson in `lessons.md` when the trap is not obvious).
- Done when: task Summary written with cause, fix and regression test.
