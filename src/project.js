// Loads the neutral harness of a project (.jow/) and the built-in catalog.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exists, read, readJson, walk, listDirs, parseFrontmatter, hash, write, json } from "./util.js";

export const GENERATOR_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CATALOG = path.join(GENERATOR_ROOT, "catalog");
export const SYSTEMS = ["claude", "opencode", "codex"];
export const KINDS = ["skill", "agent", "hook", "memory", "loop", "workflow"];
export const KIND_DIRS = { skill: "skills", agent: "agents", hook: "hooks", memory: "memory", loop: "loops", workflow: "workflows" };
export const AUTONOMY = ["guided", "step", "auto"];
export const TRIGGERS = ["auto", "manual"];

export const HOOK_EVENTS = ["session-start", "prompt-submit", "before-edit", "after-edit", "before-shell", "after-shell", "stop"];

export function defaultManifest(name) {
  return {
    version: 1,
    name,
    systems: [],
    stack: [],
    commands: { install: "", build: "", test: "", "test-unit": "", "test-integration": "", lint: "", typecheck: "", format: "", bench: "" },
    formatters: {},
    permissions: {
      "allow-shell": ["git status", "git diff", "git log", "git show"],
      "deny-read": [".env", ".env.*", "secrets/**"],
    },
    loop: {
      claude: ["--permission-mode", "acceptEdits"],
      codex: ["--sandbox", "workspace-write"],
      opencode: [],
    },
    // trigger: auto = every development request goes through the `dev` skill; manual = only /dev.
    // autonomy: guided = stop at [gate] phases; step = stop after each phase; auto = stop only when blocked.
    orchestrator: { trigger: "auto", autonomy: "guided" },
  };
}

/** Reads every item of one kind from a base dir laid out like .jow/ or catalog/. */
export function readItems(base, kind) {
  const dir = path.join(base, KIND_DIRS[kind]);
  if (kind === "skill") {
    return listDirs(dir)
      .filter((n) => exists(path.join(dir, n, "SKILL.md")))
      .map((n) => {
        const { data, body } = parseFrontmatter(read(path.join(dir, n, "SKILL.md")));
        const files = walk(path.join(dir, n)).filter((f) => f !== "SKILL.md");
        return { kind, name: n, data, body, dir: path.join(dir, n), files };
      });
  }
  if (kind === "hook") {
    return listDirs(dir)
      .filter((n) => exists(path.join(dir, n, "hook.json")))
      .map((n) => ({ kind, name: n, data: readJson(path.join(dir, n, "hook.json"), {}), dir: path.join(dir, n) }));
  }
  return walk(dir)
    .filter((f) => f.endsWith(".md") && !f.includes("/"))
    .map((f) => {
      const { data, body } = parseFrontmatter(read(path.join(dir, f)));
      return { kind, name: f.slice(0, -3), data, body };
    });
}

const DIR_KINDS = ["skill", "hook"];

/** Path of an item under a base laid out like .jow/ or catalog/. */
export function itemPath(base, kind, name) {
  const dir = path.join(base, KIND_DIRS[kind]);
  return DIR_KINDS.includes(kind) ? path.join(dir, name) : path.join(dir, `${name}.md`);
}

/** Content hash of an item (all its files), insensitive to CRLF/LF checkouts. */
export function itemHash(base, kind, name) {
  const p = itemPath(base, kind, name);
  if (!exists(p)) return null;
  const text = (f) => read(f).replace(/\r\n/g, "\n");
  if (!DIR_KINDS.includes(kind)) return hash(text(p));
  return hash(walk(p).map((f) => `${f}\0${text(path.join(p, f))}`).join("\0\0"));
}

export function loadCatalog() {
  return Object.fromEntries(KINDS.map((k) => [k, readItems(CATALOG, k)]));
}

export const LEGACY_HINT = "this project uses .harness/, the source folder of versions before 0.3: rename it to .jow (git mv .harness .jow), then run 'jo-workflow upgrade' and 'jo-workflow sync'";

export class Project {
  constructor(root) {
    this.root = root;
    this.harness = path.join(root, ".jow");
  }
  get initialized() {
    return exists(path.join(this.harness, "harness.json"));
  }
  /** True when the project still uses the pre-0.3 source folder .harness/. */
  get legacy() {
    return !this.initialized && exists(path.join(this.root, ".harness", "harness.json"));
  }
  get manifestPath() {
    return path.join(this.harness, "harness.json");
  }
  get lockPath() {
    return path.join(this.harness, "lock.json");
  }
  manifest() {
    const m = readJson(this.manifestPath, null);
    if (!m) throw new Error(`no harness here: ${this.manifestPath} not found (run 'jo-workflow init')`);
    const d = defaultManifest(m.name);
    return { ...d, ...m, commands: { ...d.commands, ...m.commands }, permissions: { ...d.permissions, ...m.permissions }, loop: { ...d.loop, ...m.loop }, orchestrator: { ...d.orchestrator, ...m.orchestrator } };
  }
  lock() {
    const lock = readJson(this.lockPath, {});
    const out = { version: 1, files: {}, managed: {}, catalog: {}, ...lock };
    // Locks written before 0.3 track the runtime under .harness/: same files, new folder.
    for (const table of ["files", "managed"])
      out[table] = Object.fromEntries(Object.entries(out[table]).map(([p, h]) => [p.replace(/^\.harness\//, ".jow/"), h]));
    return out;
  }
  /** Records (hash) or forgets (null) the catalog version an item was installed from. */
  recordCatalog(kind, name, itemHashValue) {
    const lock = this.lock();
    if (itemHashValue) lock.catalog[`${kind}/${name}`] = itemHashValue;
    else delete lock.catalog[`${kind}/${name}`];
    write(this.lockPath, json(lock));
  }
  get overridesDir() {
    return path.join(this.harness, "overrides");
  }
  items() {
    return Object.fromEntries(KINDS.map((k) => [k, readItems(this.harness, k)]));
  }
}

/** Validates the neutral items and returns a list of problems. */
export function validate(items) {
  const problems = [];
  for (const s of items.skill) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.name) || s.name.length > 64) problems.push(`skill '${s.name}': name must be lowercase letters, digits and single hyphens, max 64`);
    if (s.data.name && s.data.name !== s.name) problems.push(`skill '${s.name}': frontmatter name '${s.data.name}' differs from folder name`);
    if (!s.data.description) problems.push(`skill '${s.name}': description is required`);
    else if (String(s.data.description).length > 1024) problems.push(`skill '${s.name}': description longer than 1024 characters`);
  }
  for (const a of items.agent) if (!a.data.description) problems.push(`agent '${a.name}': description is required`);
  for (const h of items.hook) {
    if (!HOOK_EVENTS.includes(h.data.event)) problems.push(`hook '${h.name}': unknown event '${h.data.event}' (expected ${HOOK_EVENTS.join(", ")})`);
    if (!exists(path.join(h.dir, "run.mjs"))) problems.push(`hook '${h.name}': run.mjs is missing`);
  }
  for (const l of items.loop) if (!l.data.until) problems.push(`loop '${l.name}': 'until' is required`);
  for (const w of items.workflow) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(w.name)) problems.push(`workflow '${w.name}': name must be lowercase letters, digits and single hyphens`);
    if (!w.data.description) problems.push(`workflow '${w.name}': description is required`);
  }
  return problems;
}
