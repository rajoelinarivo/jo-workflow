// stop: if there are uncommitted changes, run lint and typecheck. On failure,
// exit 2 so the agent continues and fixes them - only once per stop, to avoid loops.
import fs from "node:fs";
import { spawnSync, execSync } from "node:child_process";

const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
if (input.stop_active) process.exit(0);

let changed = "";
try {
  changed = execSync("git status --porcelain", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  process.exit(0);
}
if (!changed) process.exit(0);

const { commands = {} } = JSON.parse(fs.readFileSync(".jow/harness.json", "utf8"));
const failures = [];
for (const key of ["lint", "typecheck"]) {
  const cmd = commands[key];
  if (!cmd) continue;
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    const out = `${r.stdout || ""}${r.stderr || ""}`.split(/\r?\n/).slice(-40).join("\n");
    failures.push(`\`${cmd}\` failed:\n${out}`);
  }
}

if (failures.length) {
  process.stderr.write(`Before finishing, fix these problems introduced in the working tree (do not disable rules):\n\n${failures.join("\n\n")}`);
  process.exit(2);
}
