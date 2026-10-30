// session-start: prints context for the agent (stdout is added to the session).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

const lines = [];
const branch = git("branch --show-current") || git("rev-parse --abbrev-ref HEAD");
if (branch) {
  const changes = git("status --porcelain").split("\n").filter(Boolean).length;
  lines.push(`Git: branch ${branch}, ${changes} uncommitted change(s).`);
  const recent = git("log --oneline -5");
  if (recent) lines.push("Recent commits:", recent);
}

// Warn when .harness/ was edited after the last sync.
const lock = path.join(".harness", "lock.json");
if (fs.existsSync(lock)) {
  const synced = fs.statSync(lock).mtimeMs;
  const stale = [];
  for (const dir of ["memory", "skills", "agents", "hooks", "loops"]) {
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (fs.statSync(p).mtimeMs > synced + 1000) stale.push(p.split(path.sep).join("/"));
      }
    };
    walk(path.join(".harness", dir));
  }
  if (stale.length) {
    lines.push(`Harness: ${stale.length} file(s) in .harness/ changed since the last sync (${stale.slice(0, 5).join(", ")}). Generated instructions may be outdated: run \`workflow-generator sync\` or read those files directly.`);
  }
}

if (lines.length) console.log(lines.join("\n"));
