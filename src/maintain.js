// upgrade: refresh .harness/ items from the catalog when the dev did not change them.
// adopt: bring hand edits of generated files back into .harness/.
import fs from "node:fs";
import path from "node:path";
import { exists, read, write, walk, toPosix, hash, parseFrontmatter, frontmatter } from "./util.js";
import { CATALOG, KINDS, itemPath, itemHash, loadCatalog } from "./project.js";
import { renderAll, CLAUDE_TOOLS } from "./render.js";

const DIR_KINDS = ["skill", "hook"];

function installFromCatalog(project, kind, name) {
  const src = itemPath(CATALOG, kind, name);
  const dest = itemPath(project.harness, kind, name);
  fs.rmSync(dest, { recursive: true, force: true });
  if (DIR_KINDS.includes(kind)) {
    for (const f of walk(src)) {
      fs.mkdirSync(path.dirname(path.join(dest, f)), { recursive: true });
      fs.copyFileSync(path.join(src, f), path.join(dest, f));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return itemHash(CATALOG, kind, name);
}

export { installFromCatalog };

/**
 * Returns { updated, current, modified, available, custom } as lists of "kind/name".
 * An item is upgraded only when its content still equals the catalog version it was
 * installed from (recorded in lock.json), unless `force`.
 */
export function upgrade(project, { force = false, dryRun = false } = {}) {
  const lock = project.lock();
  const report = { updated: [], current: [], modified: [], available: [], custom: [] };
  const catalog = loadCatalog();
  for (const kind of KINDS) {
    const catalogNames = new Set(catalog[kind].map((i) => i.name));
    for (const item of catalog[kind]) {
      const key = `${kind}/${item.name}`;
      if (!exists(itemPath(project.harness, kind, item.name))) {
        report.available.push(key);
        continue;
      }
      const latest = itemHash(CATALOG, kind, item.name);
      const current = itemHash(project.harness, kind, item.name);
      if (current === latest) {
        lock.catalog[key] = latest;
        report.current.push(key);
        continue;
      }
      if (lock.catalog[key] !== current && !force) {
        report.modified.push(key);
        continue;
      }
      if (!dryRun) installFromCatalog(project, kind, item.name);
      lock.catalog[key] = latest;
      report.updated.push(key);
    }
    for (const item of project.items()[kind]) if (!catalogNames.has(item.name)) report.custom.push(`${kind}/${item.name}`);
  }
  if (!dryRun) write(project.lockPath, JSON.stringify(lock, null, 2) + "\n");
  return report;
}

// ---------------------------------------------------------------- adopt

// Generated files without a neutral source that devs are expected to customize.
const OVERRIDE_BY_DEFAULT = [".codex/config.toml"];

const escapeRe =(s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Turns rendered values back into the placeholders the original source used. */
export function unrender(text, original, manifest) {
  let out = text;
  const keys = [...new Set([...original.matchAll(/\{\{\s*commands\.([A-Za-z0-9_-]+)\s*\}\}/g)].map((m) => m[1]))];
  // Longer commands first so `npm test` does not eat part of `npm test -- --watch`.
  keys.sort((a, b) => (manifest.commands[b] || "").length - (manifest.commands[a] || "").length);
  for (const key of keys) {
    const cmd = manifest.commands[key];
    if (cmd) out = out.split(`\`${cmd}\``).join(`\`{{commands.${key}}}\``);
    else {
      // The rendered text lost the backticks: restore the form the source used.
      const ticked = new RegExp(`\`\\{\\{\\s*commands\\.${escapeRe(key)}\\s*\\}\\}\``).test(original);
      const placeholder = ticked ? `\`{{commands.${key}}}\`` : `{{commands.${key}}}`;
      out = out.split(`the project's ${key} command (not configured yet, see project memory)`).join(placeholder);
    }
  }
  if (/\{\{\s*project\.name\s*\}\}/.test(original)) {
    out = out.replace(new RegExp(`(?<![\\w-])${escapeRe(manifest.name)}(?![\\w-])`, "g"), "{{project.name}}");
  }
  return out;
}

const CLAUDE_TO_NEUTRAL = Object.fromEntries(Object.entries(CLAUDE_TOOLS).flatMap(([n, list]) => list.map((t) => [t, n])));

function parseCodexAgent(text) {
  const description = text.match(/^description = (".*")$/m);
  const instructions = text.match(/^developer_instructions = '''\r?\n([\s\S]*?)'''/m);
  return { description: description ? JSON.parse(description[1]) : undefined, body: instructions ? instructions[1] : "" };
}

/** Writes a hand-edited generated file back into its neutral source. Returns the source path. */
function adoptIntoSource(project, manifest, source, text) {
  const src = itemPath(project.harness, source.kind, source.name);
  if (source.kind === "skill" && source.file !== "SKILL.md") {
    const dest = path.join(src, source.file);
    const original = exists(dest) ? read(dest) : "";
    write(dest, source.file.endsWith(".md") ? unrender(text, original, manifest) : text);
    return dest;
  }
  const file = source.kind === "skill" ? path.join(src, "SKILL.md") : src;
  const original = parseFrontmatter(read(file));
  const data = { ...original.data };
  let body;
  if (source.flavor === "codex") {
    const parsed = parseCodexAgent(text);
    if (parsed.description) data.description = parsed.description;
    body = parsed.body;
  } else {
    const gen = parseFrontmatter(text);
    if (gen.data.description) data.description = gen.data.description;
    body = gen.body;
    if (source.kind === "skill") {
      if (gen.data["argument-hint"] !== undefined) data["argument-hint"] = String(gen.data["argument-hint"]);
      if (source.flavor === "claude") data["user-invocable"] = gen.data["user-invocable"] !== false;
    }
    if (source.kind === "agent" && source.flavor === "claude" && typeof gen.data.tools === "string") {
      data.tools = [...new Set(gen.data.tools.split(",").map((t) => CLAUDE_TO_NEUTRAL[t.trim()]).filter(Boolean))];
    }
    if (source.kind === "agent" && source.flavor === "claude" && gen.data.model) data.model = gen.data.model;
  }
  const gap = /^\r?\n/.test(original.body) ? "\n" : "";
  write(file, frontmatter(data, gap + unrender(body.replace(/^\r?\n/, ""), original.body, manifest)));
  return file;
}

/**
 * Adopts hand edits of generated files. Skill and agent files go back to their
 * neutral source (and so reach every system); other files, or all with `override`,
 * become verbatim overrides in .harness/overrides/.
 * Returns { adopted: [{path, into}], skipped: [{path, reason}], forcePaths }.
 */
export function adopt(project, paths, { override = false } = {}) {
  const manifest = project.manifest();
  const rendered = renderAll(manifest, project.items());
  const byPath = new Map(rendered.files.map((f) => [f.path, f]));
  const merged = new Set(rendered.merges.map((m) => m.path));
  const report = { adopted: [], skipped: [], forcePaths: new Set() };

  for (const input of paths) {
    const rel = toPosix(path.relative(project.root, path.resolve(input)));
    const entry = byPath.get(rel);
    if (merged.has(rel)) {
      report.skipped.push({ path: rel, reason: "shared config file: your own entries are already kept by sync" });
      continue;
    }
    if (!entry) {
      report.skipped.push({ path: rel, reason: "not a generated file" });
      continue;
    }
    const abs = path.join(project.root, rel);
    if (!exists(abs)) {
      report.skipped.push({ path: rel, reason: "file does not exist" });
      continue;
    }
    const buf = fs.readFileSync(abs);
    if (hash(buf) === hash(entry.content)) {
      report.skipped.push({ path: rel, reason: "no change to adopt" });
      continue;
    }
    if (!entry.source && !override && !OVERRIDE_BY_DEFAULT.includes(rel)) {
      const reason = ["AGENTS.md", "CLAUDE.md"].includes(rel)
        ? "built from .harness/memory/*.md: put the change in the right memory file, or use --override to freeze this file"
        : "built from .harness/ (hooks, skills, runtime): change the source, or use --override to freeze this file";
      report.skipped.push({ path: rel, reason });
      continue;
    }
    let into;
    if (override || !entry.source) {
      into = path.join(project.overridesDir, rel);
      write(into, buf);
    } else {
      into = adoptIntoSource(project, manifest, entry.source, buf.toString("utf8"));
    }
    report.adopted.push({ path: rel, into: toPosix(path.relative(project.root, into)) });
    report.forcePaths.add(rel);
  }
  return report;
}
