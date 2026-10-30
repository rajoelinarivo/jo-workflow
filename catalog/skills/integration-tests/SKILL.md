---
name: integration-tests
description: "Write integration tests that exercise real collaborators (database, HTTP, message queues, filesystem, cache) using containers or test doubles only at the system edges, with deterministic fixtures and reliable cleanup. Use when the user says integration test, end-to-end the persistence/API layer, test with a real database, test the endpoint, contract test, or verify wiring between components."
category: tests
user-invocable: true
argument-hint: "[component, endpoint or flow to test]"
---
# Integration tests

## 1. Choose the scope
- Name the flow under test and its boundary: e.g. HTTP handler -> service -> repository -> real database.
- Inside the boundary: real code and real infrastructure. Outside: third-party services you do not control (payment providers, SaaS APIs) replaced by test doubles at the network edge (stub server, recorded responses, provider sandbox).
- Do not duplicate unit-level edge cases here; cover wiring, queries, serialization, transactions, configuration and error mapping.

## 2. Provide real collaborators
In order of preference:
1. Ephemeral containers started by the tests (Testcontainers or the ecosystem equivalent, or a compose file started by the test command) with the same engine and major version as production.
2. Embedded/in-process versions only if behavior is equivalent for what you test (beware: an in-memory DB with a different SQL dialect is not equivalent).
3. Shared test environment as a last resort, with isolated namespaces per run.
Reuse existing project infrastructure for this; check how current integration tests start dependencies.

## 3. Data and fixtures
- Apply the real schema migrations at startup; never hand-create tables in tests.
- Each test creates the data it needs through builders/factories with explicit values. No dependency on data left by other tests.
- Deterministic values: fixed clock, seeded randomness, explicit ids or captured generated ids.
- Isolation: per-test transaction rollback, truncation of touched tables, unique per-test namespaces (schema, bucket, queue, key prefix), or a fresh container per suite.

## 4. Cleanup
- Cleanup runs even when the test fails (teardown/finally/fixture finalizers).
- Containers and ports are released at the end of the run. Use random free ports, never fixed ones.

## 5. Asynchrony
- For queues and background jobs, wait on a condition with a timeout (poll until the message is consumed or the row appears), never fixed sleeps.
- Assert on final observable state and on messages produced.

## 6. Run
- Run `{{commands.test-integration}}`; if not configured, run `{{commands.test}}` and check whether integration tests are part of it.
- Keep integration tests separated (directory, tag or naming suffix) so `{{commands.test-unit}}` stays fast.
- Run the suite twice in a row and in random order to prove isolation.
- If a container runtime is required, say so in `.harness/memory/project.md`.

## Definition of done
- The flow is exercised through real infrastructure from entry point to storage and back.
- Tests are independent, repeatable and clean up after themselves.
- Failure messages show what was expected vs found (including the response body or row contents).
- Suite runs headless in CI with documented prerequisites.

## Pitfalls
- Tests passing only in a specific order or on a dirty database.
- Mocking your own repository in an "integration" test.
- Real external services in CI: flaky, slow, may cost money or leak data.
- Hard-coded credentials; use test-only values via environment variables.

Record environment quirks (container startup, ports, timeouts) in `.harness/memory/lessons.md`.
