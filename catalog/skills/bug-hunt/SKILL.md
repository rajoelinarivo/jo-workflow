---
name: bug-hunt
description: "Systematically find and fix a bug: reproduce, reduce to a minimal repro, write a failing test first, isolate with bisection/logging/git bisect, fix the root cause rather than the symptom, add a regression test and record the lesson. Use when the user says bug, broken, crash, error, exception, fails, regression, flaky, wrong output, doesn't work, or pastes a stack trace."
category: debug
user-invocable: true
argument-hint: "[symptom, error message or failing test]"
---
# Bug hunt

## 1. Reproduce
- Collect the exact symptom: error message, stack trace, input, environment (OS, runtime version, config), expected vs actual.
- Reproduce locally with the smallest command possible. Record that command.
- If you cannot reproduce: check environment differences (versions, config, data, timezone, locale, concurrency, caches). Ask for missing details rather than guessing.
- Flaky? Run it in a loop (e.g. 20–100 times) to measure the failure rate; suspect ordering, shared state, time, randomness, concurrency.

## 2. Minimize
- Strip the input, configuration and code path until removing anything makes the bug disappear.
- The minimal repro often names the cause by itself.

## 3. Failing test first
- Encode the minimal repro as an automated test at the lowest level that reproduces it (unit if possible, integration if wiring is involved).
- Run it and confirm it fails for the right reason (same error, same wrong value), not because of test setup.

## 4. Isolate
Pick the cheapest technique that applies:
- Read the stack trace from the innermost frame you own outward.
- Binary search the code path: add assertions or logs at midpoints, check where state first goes wrong.
- Binary search the input: halve the data until the culprit remains.
- Binary search history: if it used to work, `git bisect start; git bisect bad; git bisect good <known-good-ref>` then `git bisect run <repro command>`. Finish with `git bisect reset`.
- Use a debugger with breakpoints at the first wrong state instead of sprinkling prints everywhere.
- Diff working vs failing environments one variable at a time.

## 5. Find the root cause
- Ask "why" until the answer is a defect in code, data or assumptions, not "the value was null".
- Check the same pattern elsewhere: grep for sibling call sites with the same flaw.
- Explain the cause in one or two sentences before writing the fix. If you cannot, you have not found it.

## 6. Fix
- Smallest change that removes the cause. Do not paper over symptoms (catch-all exceptions, null checks hiding a broken invariant, retries hiding a race, sleeps).
- Fix sibling occurrences found in step 5, or list them for the user.
- Remove temporary logs and debug code.

## 7. Verify
- The failing test now passes; keep it as the regression test with a name describing the bug.
- Run `{{commands.test}}`, `{{commands.lint}}`, `{{commands.typecheck}}`. For flaky bugs, rerun the loop from step 1.

## 8. Record
Add a line to `.harness/memory/lessons.md`: `- YYYY-MM-DD — <root cause and how to avoid it> (<area/file>)` when the bug reveals a non-obvious trap.

## Definition of done
- Root cause explained; fix targets it.
- Regression test fails without the fix and passes with it.
- Full suite green; no debug leftovers.

## Pitfalls
- Fixing before reproducing.
- Changing several things at once, then not knowing which one mattered.
- Deleting or loosening an assertion to make a test pass.
- Blaming the framework or compiler before ruling out your own code.
