---
name: code-generation
description: "Generate code from a spec, schema, OpenAPI/AsyncAPI/GraphQL/protobuf definition, database schema or templates, consistent with existing conventions; prefers the project's existing generators, never hand-edits generated output, regenerates deterministically. Use when the user says generate code, generate client/server/models/DTOs from a schema, scaffold from OpenAPI, codegen, regenerate, or create types from the database."
category: generation
user-invocable: true
argument-hint: "[spec/schema path or what to generate]"
---
# Code generation

## 1. Identify the source of truth
- Locate the input: OpenAPI/AsyncAPI file, GraphQL schema, protobuf/IDL, JSON Schema, database schema or migrations, template set, or a written spec.
- If the input is a written spec only, decide with the user whether to first formalize it into a machine-readable schema. A schema is reviewable and regenerable; prose is not.
- Confirm which side is authoritative (schema-first vs code-first). Never maintain both by hand.

## 2. Find existing tooling first
- Search the repo for generator configs, scripts and markers: generator config files, `generated` folders, "DO NOT EDIT" / "auto-generated" headers, build tasks, package scripts, Makefile targets.
- If a generator is already in use, reuse it with the same version and options. Do not introduce a second generator for the same job.
- If none exists, choose the ecosystem's standard, maintained generator. Record the choice (tool, version, options) as an ADR in `.harness/memory/decisions.md`.
- Hand-writing code is acceptable only when the output is small and no reasonable generator exists; still keep it derived from the schema and say so in a header comment.

## 3. Configure for determinism
- Pin the generator version (lockfile, tool manifest, container image tag).
- Fix all options in a committed config file; no interactive prompts, no machine-specific paths.
- Remove nondeterminism: timestamps in headers, unordered map iteration, absolute paths. Run the generator twice and confirm a zero diff.
- Provide a single regeneration entry point (script or build task) and document it in `.harness/memory/conventions.md`.

## 4. Place and isolate generated output
- Put generated files in a dedicated directory or with a recognizable suffix, with a "generated, do not edit" header.
- Exclude generated code from lint/format rules that would fight the generator, but keep it compiled and type-checked.
- Decide whether generated files are committed. Commit them if consumers build without the generator; otherwise generate in the build. Be consistent.

## 5. Customize without editing output
- Extend via the generator's mechanisms: templates, config options, hooks, partial classes, extension methods, wrapper modules, composition.
- Business logic lives in hand-written files that import the generated code.
- If a generated file is wrong, fix the schema, the template or the config, then regenerate. Never patch the output.

## 6. Verify
1. Regenerate from scratch (delete the output directory first).
2. `{{commands.build}}` and `{{commands.typecheck}}`.
3. `{{commands.test}}`; add contract or golden tests (see `golden-tests`) that pin the generated surface when it is a public API.
4. Review the diff of generated output for unexpected changes caused by version or option drift.

## Definition of done
- Generated code builds and is consumed by hand-written code without manual edits.
- Regeneration is a single documented command and is idempotent.
- Generator version and options are pinned and recorded.

## Pitfalls
- Hand edits in generated files: lost on the next regeneration. Grep the diff for them.
- Mixing generator versions across machines or CI.
- Generating huge surfaces nobody uses: restrict to needed operations/tables when the tool allows.
- Naming that violates project conventions: fix via generator options, not by renaming output.

Record recurring generator gotchas in `.harness/memory/lessons.md`.
