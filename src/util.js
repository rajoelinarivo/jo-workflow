import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const exists = (p) => fs.existsSync(p);
export const read = (p) => fs.readFileSync(p, "utf8");
export const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
export const toPosix = (p) => p.split(path.sep).join("/");

export function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

export function readJson(p, fallback) {
  if (!exists(p)) return fallback;
  try {
    // Strip the UTF-8 BOM some Windows tools write (PowerShell 5.1, Notepad).
    return JSON.parse(read(p).replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`invalid JSON in ${p}: ${e.message}`);
  }
}

export const json = (v) => JSON.stringify(v, null, 2) + "\n";

/** Lists files under dir recursively, as posix paths relative to dir. */
export function walk(dir, base = dir) {
  if (!exists(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(toPosix(path.relative(base, full)));
  }
  return out.sort();
}

export function listDirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

// ---------------------------------------------------------------- frontmatter
// Minimal YAML subset: `key: value`, inline lists `[a, b]`, block lists `- a`,
// booleans, numbers, quoted strings. Enough for the neutral format.

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.startsWith('"') ? JSON.parse(v) : v.slice(1, -1).replace(/''/g, "'");
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(",").map((x) => parseScalar(x)) : [];
  }
  return v;
}

export function parseFrontmatter(text) {
  const m = text.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let lastKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && lastKey) {
      if (!Array.isArray(data[lastKey])) data[lastKey] = [];
      data[lastKey].push(parseScalar(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      data[lastKey] = parseScalar(kv[2]);
    }
  }
  return { data, body: m[2] };
}

function yamlScalar(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  const s = String(v);
  if (s === "" || /^[\s\[\]{}>|*&!%@`#'",?-]|: | #|^(true|false|null|yes|no)$|^\d/.test(s) || s !== s.trim()) {
    return JSON.stringify(s);
  }
  return s;
}

/** Serializes flat data (scalars, scalar lists, one level of nested maps). */
export function frontmatter(data, body) {
  const lines = ["---"];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(yamlScalar).join(", ")}]`);
    else if (typeof v === "object") {
      lines.push(`${k}:`);
      for (const [k2, v2] of Object.entries(v)) lines.push(`  ${k2}: ${yamlScalar(v2)}`);
    } else lines.push(`${k}: ${yamlScalar(v)}`);
  }
  lines.push("---");
  return lines.join("\n") + "\n" + body.replace(/^\n+/, "\n");
}

// ---------------------------------------------------------------- placeholders

export function renderPlaceholders(text, manifest) {
  // Accepts both `{{commands.x}}` and bare {{commands.x}}; a configured command is
  // rendered as inline code, a missing one as plain text.
  return text.replace(/(`?)\{\{\s*([a-z]+)\.([A-Za-z0-9_-]+)\s*\}\}\1/g, (all, tick, scope, key) => {
    const extra = manifest.placeholders?.[`${scope}.${key}`];
    if (extra !== undefined) return tick + extra + tick;
    if (scope === "project" && key === "name") return tick + manifest.name + tick;
    if (scope === "commands") {
      const cmd = manifest.commands?.[key];
      return cmd ? `\`${cmd}\`` : `the project's ${key} command (not configured yet, see project memory)`;
    }
    return all;
  });
}
