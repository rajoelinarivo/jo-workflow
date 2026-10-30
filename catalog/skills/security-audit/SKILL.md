---
name: security-audit
description: "Audit code and dependencies for security issues: leaked secrets, injection, broken authentication/authorization, vulnerable dependencies (with the right audit tool per ecosystem), unsafe deserialization, insecure configuration; report findings by severity with fixes. Use when the user says security audit, security review, vulnerabilities, CVE, dependency audit, is this secure, pentest prep, OWASP, or check for secrets."
category: quality
user-invocable: true
argument-hint: "[scope: whole repo, module or diff]"
---
# Security audit

## 1. Scope and threat model
- Define scope (repo, module, diff) and the assets: user data, credentials, money, availability.
- Map trust boundaries: every place external input enters (HTTP, CLI args, files, env, queues, webhooks, DB content written by users) and every privileged action.
- Note the deployment context (internet-facing, internal, desktop, mobile) to calibrate severity.

## 2. Secrets
- Scan the working tree and history with a secret scanner if available (gitleaks, trufflehog, detect-secrets) or grep for key patterns, `password=`, `token`, private key headers, connection strings.
- Check config files, test fixtures, CI files, Dockerfiles, notebooks, logs.
- Any real secret found: report as Critical, recommend rotation (removing from history is not enough).

## 3. Dependencies
Run the ecosystem's audit tool(s):
- Node: `npm audit` / `pnpm audit` / `yarn npm audit`
- Python: `pip-audit`, `safety`
- Go: `govulncheck ./...`
- Rust: `cargo audit`, `cargo deny check`
- Java/Kotlin: OWASP Dependency-Check, `gradle dependencyCheckAnalyze`, Maven `dependency-check:check`
- .NET: `dotnet list package --vulnerable --include-transitive`
- PHP: `composer audit`
- Ruby: `bundle audit` (bundler-audit), `brakeman` for Rails code
- C/C++: check vendored libs and package manager manifests (vcpkg, conan) against advisories; OSV-Scanner
- Mobile: OSV-Scanner on lockfiles; platform dependency checks
- Any ecosystem: `osv-scanner`, Trivy for containers and IaC
Report only vulnerabilities reachable or plausibly relevant; note fixed versions.

## 4. Code review for classes of bugs
- Injection: SQL/NoSQL built by string concatenation, shell commands with user input, path traversal, template injection, XSS from unescaped output, header injection, regex DoS.
- AuthN/AuthZ: missing checks on endpoints, IDOR (object accessed by id without ownership check), privilege escalation, insecure session/token handling, missing CSRF protection for cookie auth.
- Deserialization: native object deserialization of untrusted data (pickle, Java serialization, BinaryFormatter, PHP unserialize, YAML full loaders), XML external entities.
- Crypto: home-made crypto, MD5/SHA1 for passwords, static IVs, disabled TLS verification, insecure randomness for tokens.
- SSRF and open redirects; file upload validation; unbounded resource use.
- Logging of secrets or personal data; verbose error messages to clients.
- Configuration: debug mode in prod, permissive CORS, default credentials, overly broad IAM/file permissions, containers running as root.
Use static analyzers if available (Semgrep, CodeQL, Bandit, gosec, SpotBugs, Roslyn analyzers, Brakeman).

## 5. Report
Sort by severity: **Critical**, **High**, **Medium**, **Low**, **Info**. For each:
```
[High] api/users.go:88 — user id from path used without ownership check (IDOR).
Impact: any authenticated user can read other users' profiles.
Fix: compare path id with session user or check role; add a test for 403.
```
Include tool outputs summary, what was out of scope, and false positives dismissed with reasons.

## Definition of done
- Secrets, dependencies and code classes above all checked, or explicitly listed as not checked.
- Every finding has location, impact, fix; severities justified by exposure.
- Fixes applied only if the user asked; otherwise report.

## Pitfalls
- Dumping raw scanner output without triage.
- Printing discovered secret values in the report; mask them.
- Ignoring transitive dependencies and container base images.

Record accepted risks and security decisions in `.jow/memory/decisions.md`; recurring pitfalls in `.jow/memory/lessons.md`. Never write secrets to memory files.
