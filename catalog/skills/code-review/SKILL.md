---
name: code-review
description: "Review a diff or set of changes and report findings ordered by severity (correctness, security, tests, readability, consistency), each with file:line and a concrete fix. Use when the user says review, code review, check my changes, review this PR/diff/branch/commit, is this ready to merge, or before finishing any implementation as a self-review."
category: quality
user-invocable: true
argument-hint: "[diff target: branch, commit range, PR or files]"
---
# Code review

## 1. Get the diff and context
- Determine the target: uncommitted changes (`git diff` and `git diff --staged`), a branch (`git diff <base>...HEAD`), a commit range or given files.
- Read the stated intent (ticket, PR description, user request). Review against the intent, not your preferences.
- Read surrounding code for each hunk, not only the changed lines: callers, callees, tests, config.
- Load `.harness/memory/conventions.md` and relevant `decisions.md` entries; consistency is judged against them.

## 2. Check, in this order
**Correctness (blocker/major)**
- Logic errors, off-by-one, wrong conditions, null/empty handling, integer overflow, float comparison.
- Error paths: swallowed errors, wrong error types, missing cleanup, partial writes, resource leaks.
- Concurrency: races, shared mutable state, missing locks or awaits, non-atomic check-then-act.
- Data: migrations reversible, backward-compatible formats, timezone/encoding issues.
- API contract changes that break callers.

**Security (blocker/major)**
- Injection (SQL, shell, path, template, LDAP), unvalidated input at trust boundaries, missing authz checks, secrets in code or logs, unsafe deserialization, weak crypto, SSRF, overly broad permissions. Escalate to the `security-audit` skill for wide concerns.

**Tests (major/minor)**
- New behavior and fixed bugs covered; tests would fail if the code were wrong; no skipped or deleted tests without justification; deterministic.

**Readability (minor)**
- Names, function size, dead code, commented-out code, misleading comments, needless complexity.

**Consistency (minor/nit)**
- Project conventions, layering, error-handling and logging patterns, formatting the linter does not catch.

## 3. Verify, do not guess
- Run `{{commands.lint}}`, `{{commands.typecheck}}` and `{{commands.test}}` if available and report results.
- When unsure whether something is a bug, check it (read the callee, write a quick test) or phrase it as a question.

## 4. Report
Group by severity: **Blocker**, **Major**, **Minor**, **Nit**. One finding per entry:
```
[Major] src/orders/service.py:142 — total ignores discounts when currency differs.
Fix: apply discount before conversion: `total = convert(subtotal - discount, cur)`.
```
- Always file:line, the problem, why it matters, and a concrete fix or code suggestion.
- End with a short verdict: ready to merge / merge after fixes / needs rework, plus what was not reviewed.
- Mention notable good choices briefly only if they set a pattern to keep.

## Definition of done
- Every changed file read with its context.
- Findings sorted by severity with file:line and fix.
- Automated checks run (or stated why not); clear verdict.

## Pitfalls
- Bikeshedding style while missing a logic bug.
- Reviewing only the diff lines and missing broken callers.
- Vague comments ("this looks off") without a fix.
- Rewriting the author's design to your taste; flag only real problems.

When a review reveals a recurring mistake, add it to `.harness/memory/lessons.md`; when it settles a convention, add it to `.harness/memory/conventions.md`.
