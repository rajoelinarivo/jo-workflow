---
title: Conventions
order: 20
load: always
---
# Conventions

## General
- Follow the existing style of the file and module you edit; consistency beats preference.
- Use the configured formatter and linter; do not hand-format against them.
- Small, focused changes. One concern per commit; do not mix refactoring, formatting and behavior changes.
- Names say what things are or do; avoid abbreviations that are not already used in the codebase.
- Functions do one thing; prefer early returns over deep nesting.
- No dead code, commented-out code or debug output in committed changes.
- Do not add a dependency without checking for an existing one that does the job; justify new ones.
- Never commit secrets, credentials or personal data. Configuration comes from the environment or config files excluded from version control.

## Errors and logging
- Handle errors where you can act on them; otherwise propagate with context. Never swallow errors silently.
- Validate input at trust boundaries (API, CLI, files, messages).
- Log with enough context to debug, never secrets or personal data.

## Tests
- New behavior and bug fixes come with tests. Bug fixes include a regression test.
- Tests are deterministic: no real clock, network or shared mutable state without control.
- Never delete, skip or weaken a test to make a change pass.

## Git
- Commit messages: imperative summary line (e.g. `fix: handle empty cart total`), body explains why when not obvious.
- Do not commit generated build artifacts; commit lockfiles.

## Stack-specific
- Language and framework style: TODO
- Project layout and module boundaries: TODO
- Naming (files, types, functions, tests): TODO
- Error handling pattern: TODO
- Test layout, helpers and fixtures: TODO
- Code generation and regeneration command: TODO
- Snapshot/golden update command: TODO
