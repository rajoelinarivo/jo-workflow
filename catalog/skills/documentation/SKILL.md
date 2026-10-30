---
name: documentation
description: "Write or update project documentation so it matches the code: README, architecture overview, API reference, usage examples, changelog, and the harness architecture memory. Use when the user says document, write docs, update the README, API docs, changelog, release notes, explain the architecture, docs are out of date, or after a user-visible change."
category: docs
user-invocable: true
argument-hint: "[what to document or which doc to update]"
---
# Documentation

## 1. Identify the audience and the doc
- README: newcomers. What it is, install, quick start, configuration, where to go next.
- Architecture doc: maintainers. Components, responsibilities, data flow, key decisions.
- API reference: integrators. Endpoints/functions, parameters, types, errors, examples.
- Changelog: users upgrading. What changed, breaking changes, migration notes.
- Inline docs (docstrings, doc comments): callers of a public symbol.
Write for one audience per document.

## 2. Inventory what exists
- Find existing docs (README, `docs/`, wiki links, doc comments, OpenAPI spec, CHANGELOG) and the doc tooling in use (doc generator, site generator). Follow their format and location.
- Diff docs against reality: commands that no longer exist, renamed options, removed features, outdated screenshots, stale versions.

## 3. Write
- Lead with the task the reader wants to accomplish. Short sections, imperative steps, copy-pasteable commands.
- Derive facts from code and config, not from memory: read the CLI parser, route table, config schema, env var reads.
- Every example must run. Execute commands and code samples (`{{commands.install}}`, `{{commands.build}}`, `{{commands.test}}`, usage examples) and paste real output when useful.
- Prefer generating reference docs from source (doc comments, OpenAPI, schema) over hand-maintained copies; hand-write the narrative parts.
- Document configuration with name, type, default, and effect.
- Link instead of duplicating; one source of truth per fact.

## 4. Changelog
- Follow the existing format (e.g. Keep a Changelog sections: Added, Changed, Deprecated, Removed, Fixed, Security).
- Entries describe user-visible impact, not commit messages. Put breaking changes first with migration steps.
- Add to the `Unreleased` section unless releasing.

## 5. Architecture memory
Update `.harness/memory/architecture.md` whenever components, boundaries, data flow, external dependencies or deployment change:
- components and responsibilities, main data flows, storage, integrations, entry points.
- Keep it short and factual; link to the full architecture doc if one exists.
Record the reasons behind structural choices in `.harness/memory/decisions.md`, not in architecture.md.

## 6. Verify
- Commands and examples executed successfully.
- Links resolve (relative links and anchors).
- Doc build/lint passes if the project has one (`{{commands.lint}}` may cover markdown).
- Spelling and terminology consistent with the code's names.

## Definition of done
- Docs match current behavior; no reference to removed features or old commands.
- README quick start works on a fresh clone.
- Changelog updated for user-visible changes.
- `.harness/memory/architecture.md` reflects the current structure.

## Pitfalls
- Describing intended behavior instead of actual behavior.
- Restating code line by line in comments; document why, contracts and gotchas.
- Docs drifting because they duplicate generated reference material.
- Secrets or internal hostnames in examples.
