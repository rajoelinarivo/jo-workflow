---
name: unit-tests
description: "Write fast, isolated unit tests that verify behavior rather than implementation, using Arrange-Act-Assert, an explicit edge-case table and mocks only at system boundaries. Use when the user says write unit tests, add tests, test this function/class/module, increase coverage, missing tests, or TDD."
category: tests
user-invocable: true
argument-hint: "[file, function or module to test]"
---
# Unit tests

## 1. Understand the unit
- Identify the unit's public contract: inputs, outputs, side effects, errors raised, invariants.
- Read existing tests in the project to copy framework, file naming, location, helper and fixture conventions. Do not introduce a new test framework.
- If the unit is hard to isolate (hidden globals, I/O in the middle of logic, static calls), note it. Prefer testing through a seam; propose a small refactor (separate step, `refactor` skill) only if necessary.

## 2. Build the case table
Before writing code, list cases:

| Case | Input | Expected |
|---|---|---|
| nominal | ... | ... |
| empty / zero / null / missing | | |
| boundaries (min, max, off-by-one, overflow) | | |
| invalid input / error path | | |
| unicode, whitespace, large input | | |
| ordering / duplicates | | |
| time, timezone, locale-dependent | | |

Keep only the cases that exercise distinct behavior.

## 3. Write tests
- One behavior per test. Name it after the behavior: `returns_empty_list_when_no_match`, `rejects negative amount`.
- Structure each test as Arrange / Act / Assert, visually separated.
- Assert on observable results (return values, state through the public API, emitted calls at boundaries), not on private fields or call order of internal helpers.
- Use table-driven / parametrized tests for the case table where the framework supports it.
- Assertions precise: exact values and error types, not just "truthy" or "no exception".

## 4. Test doubles
- Mock or fake only at boundaries you do not own or that are slow/nondeterministic: network, filesystem, clock, randomness, database, external services.
- Prefer fakes and stubs over strict mocks; verify interactions only when the interaction is the behavior (e.g. "sends one email").
- Inject time and randomness (clock, seed) instead of sleeping or patching globals.
- Never mock the unit under test or value objects.

## 5. Run
- Run `{{commands.test-unit}}`; if that command is not configured, run `{{commands.test}}`.
- Each new test must fail when the behavior is broken. Temporarily break the code (or invert an assertion) to confirm, then restore.
- Run the new tests several times and in random order if the runner supports it, to catch shared state.

## Definition of done
- Every row of the case table covered; tests pass and are deterministic.
- Each test runs in milliseconds with no network, disk or real clock.
- Test names read as a specification of the unit.
- `{{commands.lint}}` passes on test files.

## Pitfalls
- Tests that restate the implementation line by line; they break on every refactor and catch nothing.
- Over-mocking: a test that only checks mocks were called proves nothing.
- Shared mutable fixtures between tests.
- Chasing coverage percentage with assertion-free tests.

Record testing conventions you establish (helpers, fixture patterns) in `.harness/memory/conventions.md`, and testability traps in `.harness/memory/lessons.md`.
