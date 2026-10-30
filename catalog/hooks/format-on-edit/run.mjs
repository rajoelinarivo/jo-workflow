// after-edit: runs the formatter matching each edited file (harness.json "formatters").
// Keys are globs like "*.py" or "*.{ts,tsx}"; {file} in the command is the file path.
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
const { formatters = {} } = JSON.parse(fs.readFileSync(".harness/harness.json", "utf8"));

const toRegex = (glob) => {
  const src = glob
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace(/\{([^}]+)\}/g, (_, alts) => `(${alts.split(",").join("|")})`)
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(glob.includes("/") ? `^${src}$` : `(^|/)${src}$`);
};

for (const file of input.files || []) {
  if (!fs.existsSync(file)) continue;
  const entry = Object.entries(formatters).find(([glob]) => toRegex(glob).test(file));
  if (!entry) continue;
  const cmd = entry[1].replace(/\{file\}/g, JSON.stringify(file));
  const r = spawnSync(cmd, { shell: true, encoding: "utf8" });
  if (r.status !== 0) process.stderr.write(`format-on-edit: '${cmd}' failed: ${(r.stderr || r.stdout || "").trim().slice(0, 500)}\n`);
}
