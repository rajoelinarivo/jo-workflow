---
name: generation
description: Generate code from a specification, schema, API definition, database or templates and integrate it with hand-written code.
---
# Generation

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Source and tooling
- Use: skill `code-generation`.
- Do: identify the source of truth (spec, schema, templates) and the generator the project already uses, if any.
- Done when: source, generator and output location are in the task file.

## 2. Plan [gate]
- Do: generation command, what is generated and what is hand-written, how regeneration stays deterministic; record a decision if a new generator is introduced.

## 3. Generate and integrate
- Use: skill `code-generation`, skill `implement-feature` for the hand-written glue.
- Do: never hand-edit generated files; customize through configuration or extension points.
- Check: build, typecheck

## 4. Test
- Use: skill `unit-tests` for the glue code, skill `golden-tests` to pin generated output when useful.
- Check: test, lint

## 5. Close [gate]
- Use: skill `remember` (record the regeneration command in `conventions.md`).
- Done when: regenerating from scratch gives the same output, Summary written.
