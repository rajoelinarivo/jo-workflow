---
name: testing
description: Add or improve automated tests - unit, integration, golden/snapshot, non-regression baseline or benchmark - for existing code.
---
# Testing

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Assess
- Do: identify the code under test, current coverage and gaps, and pick the kind of test:
  - logic: skill `unit-tests`
  - wiring and I/O: skill `integration-tests`
  - produced output: skill `golden-tests`
  - behavior before and after a change: skill `regression-tests`
  - speed: skill `benchmark`
- Done when: test kinds and target cases are in the task file.

## 2. Plan [gate]
- Do: list of test cases (edge-case table), fixtures needed, where the tests live.

## 3. Write tests
- Use: the chosen test skills; agent `test-writer` for large batches.
- Do: each test must fail when the behavior breaks (break the code once to prove it when practical).
- Check: test-unit, test-integration, bench as relevant

## 4. Review and close [gate]
- Use: skill `code-review` (tests are code too).
- Check: test, lint
- Done when: no flaky test, no dependency on test order or the real clock, Summary written.
