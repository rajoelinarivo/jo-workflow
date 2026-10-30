---
title: Project
order: 10
load: always
---
# {{project.name}}

## Overview
- Purpose: TODO (one or two sentences: what it does and for whom)
- Users / consumers: TODO
- Status: TODO (prototype, in development, production)
- Stack: TODO (languages, frameworks, runtime versions)
- Entry points: TODO (main binary, server, CLI, app, library API)
- Repository layout: TODO (key directories and what lives there)
- External dependencies: TODO (databases, queues, third-party services, required tools such as a container runtime)
- Deployment: TODO (where and how it runs)

## Commands
Use these commands; do not invent alternatives. If one is missing, say so instead of guessing.
- Install: `{{commands.install}}`
- Build: `{{commands.build}}`
- Test (all): `{{commands.test}}`
- Unit tests: `{{commands.test-unit}}`
- Integration tests: `{{commands.test-integration}}`
- Lint: `{{commands.lint}}`
- Typecheck: `{{commands.typecheck}}`
- Benchmarks: `{{commands.bench}}`

Commands are defined in `.harness/harness.json`. To change them, edit that file (or run `workflow-generator detect`), then `workflow-generator sync`.

## Local setup
TODO: prerequisites, environment variables (names only, never values), how to start dependencies, how to run the app.
