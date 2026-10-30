// Writes the rendered files, protecting anything the dev changed by hand.
import fs from "node:fs";
import path from "node:path";
import { exists, read, write, hash, json, readJson } from "./util.js";
import { renderAll } from "./render.js";
import { validate } from "./project.js";

const fileHash = (abs) => hash(fs.readFileSync(abs));

function removeEmptyDirs(root, rel) {
  let dir = path.dirname(path.join(root, rel));
  while (dir.startsWith(root) && dir !== root) {
    try {
      if (fs.readdirSync(dir).length) return;
      fs.rmdirSync(dir);
    } catch {
      return;
    }
    dir = path.dirname(dir);
  }
}

/**
 * Renders and writes the harness. Returns a report:
 * { created, updated, deleted, conflicts: [{path, reason}], orphans, merged, warnings, problems }
 */
export function sync(project, { force = false, dryRun = false } = {}) {
  const manifest = project.manifest();
  const items = project.items();
  const report = { created: [], updated: [], deleted: [], conflicts: [], orphans: [], merged: [], warnings: [], problems: validate(items) };
  if (report.problems.length) return report;

  const lock = project.lock();
  const next = { version: 1, files: {}, managed: {} };
  const rendered = renderAll(manifest, items);
  report.warnings.push(...rendered.warnings);

  for (const { path: rel, content } of rendered.files) {
    const abs = path.join(project.root, rel);
    const want = hash(content);
    const prev = lock.files[rel];
    if (exists(abs)) {
      const cur = fileHash(abs);
      if (cur === want) {
        next.files[rel] = want;
        continue;
      }
      if (!force && prev && cur !== prev) {
        report.conflicts.push({ path: rel, reason: "modified by hand" });
        next.files[rel] = prev;
        continue;
      }
      if (!force && !prev) {
        report.conflicts.push({ path: rel, reason: "already exists and was not generated" });
        continue;
      }
      report.updated.push(rel);
    } else {
      report.created.push(rel);
    }
    if (!dryRun) write(abs, content);
    next.files[rel] = want;
  }

  for (const [rel, h] of Object.entries(lock.files)) {
    if (rel in next.files) continue;
    const abs = path.join(project.root, rel);
    if (!exists(abs)) continue;
    if (fileHash(abs) !== h && !force) {
      report.orphans.push(rel);
      continue;
    }
    report.deleted.push(rel);
    if (!dryRun) {
      fs.rmSync(abs);
      removeEmptyDirs(project.root, rel);
    }
  }

  for (const m of rendered.merges) {
    const abs = path.join(project.root, m.path);
    const before = exists(abs) ? read(abs) : null;
    const { value, managed } = m.apply(readJson(abs, {}), lock.managed[m.path]);
    const after = json(value);
    next.managed[m.path] = managed;
    if (after === before) continue;
    report.merged.push(m.path);
    if (!dryRun) write(abs, after);
  }

  // Managed entries of merge targets that are no longer rendered (system removed).
  for (const [rel, managed] of Object.entries(lock.managed)) {
    if (rel in next.managed) continue;
    const abs = path.join(project.root, rel);
    if (!exists(abs)) continue;
    report.warnings.push(`${rel}: no longer generated; remove the harness entries by hand if needed (${JSON.stringify(managed)})`);
  }

  if (!dryRun) write(project.lockPath, json(next));
  return report;
}
