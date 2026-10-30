// Stack detection: marker files -> default commands and formatters.
// Only fills commands that are still empty, so the dev's choices win.
import fs from "node:fs";
import path from "node:path";
import { exists, readJson } from "./util.js";

const has = (dir, f) => exists(path.join(dir, f));
const hasExt = (dir, ext) => {
  try {
    return fs.readdirSync(dir).some((f) => f.endsWith(ext));
  } catch {
    return false;
  }
};

function node(dir) {
  if (!has(dir, "package.json")) return null;
  const pkg = readJson(path.join(dir, "package.json"), {});
  const scripts = pkg.scripts || {};
  const pm = has(dir, "pnpm-lock.yaml") ? "pnpm" : has(dir, "yarn.lock") ? "yarn" : has(dir, "bun.lockb") || has(dir, "bun.lock") ? "bun" : "npm";
  const run = (s) => (scripts[s] ? (pm === "npm" ? `npm run ${s}` : `${pm} ${s}`) : "");
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const prettier = deps.prettier ? "npx prettier --write {file}" : "";
  return {
    name: "node",
    commands: {
      install: pm === "npm" ? (has(dir, "package-lock.json") ? "npm ci" : "npm install") : `${pm} install`,
      build: run("build"),
      test: scripts.test ? (pm === "npm" ? "npm test" : `${pm} test`) : "",
      "test-unit": run("test:unit"),
      "test-integration": run("test:integration") || run("test:e2e"),
      lint: run("lint"),
      typecheck: run("typecheck") || (has(dir, "tsconfig.json") ? "npx tsc --noEmit" : ""),
      format: run("format"),
      bench: run("bench"),
    },
    formatters: prettier ? { "*.{js,jsx,ts,tsx,mjs,cjs,json,css,scss,md,html,vue,svelte}": prettier } : {},
  };
}

function python(dir) {
  if (!["pyproject.toml", "requirements.txt", "setup.py", "setup.cfg", "Pipfile"].some((f) => has(dir, f))) return null;
  const uv = has(dir, "uv.lock");
  const poetry = has(dir, "poetry.lock");
  const x = uv ? "uv run " : poetry ? "poetry run " : "";
  return {
    name: "python",
    commands: {
      install: uv ? "uv sync" : poetry ? "poetry install" : has(dir, "requirements.txt") ? "pip install -r requirements.txt" : "pip install -e .",
      test: `${x}pytest`,
      "test-unit": "",
      "test-integration": "",
      lint: `${x}ruff check .`,
      typecheck: `${x}mypy .`,
      format: `${x}ruff format .`,
    },
    formatters: { "*.py": `${x}ruff format {file}` },
  };
}

const simple = (name, markers, commands, formatters = {}) => (dir) =>
  markers.some((m) => (m.startsWith("*") ? hasExt(dir, m.slice(1)) : has(dir, m))) ? { name, commands, formatters } : null;

function jvm(dir) {
  if (has(dir, "pom.xml")) {
    const mvn = has(dir, "mvnw") ? "./mvnw" : "mvn";
    return { name: "java-maven", commands: { install: `${mvn} -q dependency:resolve`, build: `${mvn} -q package -DskipTests`, test: `${mvn} test`, "test-integration": `${mvn} verify`, lint: "" }, formatters: {} };
  }
  if (has(dir, "build.gradle") || has(dir, "build.gradle.kts")) {
    const g = has(dir, "gradlew") ? "./gradlew" : "gradle";
    return { name: "jvm-gradle", commands: { build: `${g} build -x test`, test: `${g} test`, lint: `${g} check -x test` }, formatters: {} };
  }
  return null;
}

const DETECTORS = [
  node,
  python,
  simple("go", ["go.mod"], { install: "go mod download", build: "go build ./...", test: "go test ./...", lint: "go vet ./...", bench: "go test -bench=. -run=^$ ./..." }, { "*.go": "gofmt -w {file}" }),
  simple("rust", ["Cargo.toml"], { build: "cargo build", test: "cargo test", lint: "cargo clippy -- -D warnings", format: "cargo fmt", bench: "cargo bench" }, { "*.rs": "rustfmt {file}" }),
  jvm,
  simple("dotnet", ["*.sln", "*.csproj", "*.fsproj"], { install: "dotnet restore", build: "dotnet build", test: "dotnet test", format: "dotnet format" }),
  simple("php", ["composer.json"], { install: "composer install", test: "vendor/bin/phpunit" }),
  simple("ruby", ["Gemfile"], { install: "bundle install", test: "bundle exec rake test", lint: "bundle exec rubocop" }),
  simple("elixir", ["mix.exs"], { install: "mix deps.get", build: "mix compile", test: "mix test", format: "mix format" }, { "*.{ex,exs}": "mix format {file}" }),
  simple("dart", ["pubspec.yaml"], { install: "dart pub get", test: "dart test", lint: "dart analyze" }, { "*.dart": "dart format {file}" }),
  simple("swift", ["Package.swift"], { build: "swift build", test: "swift test" }),
  simple("cmake", ["CMakeLists.txt"], { build: "cmake -S . -B build && cmake --build build", test: "ctest --test-dir build" }),
];

export const KNOWN_STACKS = ["node", "python", "go", "rust", "java-maven", "jvm-gradle", "dotnet", "php", "ruby", "elixir", "dart", "swift", "cmake"];

export function detectStacks(dir) {
  const found = DETECTORS.map((d) => d(dir)).filter(Boolean);
  if (!found.length && has(dir, "Makefile")) {
    found.push({ name: "make", commands: { build: "make", test: "make test", lint: "make lint" }, formatters: {} });
  }
  return found;
}

/** Merges detected stacks into the manifest without overwriting non-empty values. */
export function applyStacks(manifest, stacks) {
  manifest.stack = [...new Set([...(manifest.stack || []), ...stacks.map((s) => s.name)])];
  for (const s of stacks) {
    for (const [k, v] of Object.entries(s.commands)) if (v && !manifest.commands[k]) manifest.commands[k] = v;
    for (const [k, v] of Object.entries(s.formatters)) if (!manifest.formatters[k]) manifest.formatters[k] = v;
  }
  return manifest;
}
