// before-shell: exit 2 blocks the command; stderr tells the agent why.
import fs from "node:fs";

const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
const cmd = String(input.command || "");

// [pattern, reason] - extend this list for your project.
const RULES = [
  [/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r|--recursive\s+--force|--force\s+--recursive)\b[^|;&]*\s(\/|~|\$HOME|\*)(\s|$)/i, "recursive delete of /, ~ or *"],
  [/\bgit\s+push\b.*(--force\b|\s-f\b)(?!-with-lease).*\b(main|master|develop|release[\w/-]*)\b/i, "force-push to a protected branch"],
  [/\bgit\s+push\b.*\b(main|master)\b.*(--force\b|\s-f\b)(?!-with-lease)/i, "force-push to a protected branch"],
  [/\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f[a-z]*d|clean\s+-[a-z]*d[a-z]*f)\b/i, "discards uncommitted work - ask the user first"],
  [/\b(curl|wget|iwr|Invoke-WebRequest)\b[^|]*\|\s*(sh|bash|zsh|pwsh|powershell|iex)\b/i, "pipes a download into a shell"],
  [/\b(mkfs|format\s+[a-z]:|diskpart|dd\s+if=.*\sof=\/dev\/)/i, "disk-level operation"],
  [/\bdrop\s+(database|schema)\b/i, "drops a database"],
  [/:\(\)\s*\{\s*:\|:&\s*\};:/, "fork bomb"],
  [/\bchmod\s+-R\s+777\s+\//, "recursive chmod 777 on /"],
  [/\b(cat|type|Get-Content|less|more|head|tail)\b[^|;&]*(^|[\s/\\])\.env(\.[\w.-]+)?(\s|$)/i, "reads a .env secrets file"],
];

for (const [re, reason] of RULES) {
  if (re.test(cmd)) {
    process.stderr.write(`Blocked by guard-shell: ${reason}.\nCommand: ${cmd}\nIf this is really needed, explain why and ask the user to run it.`);
    process.exit(2);
  }
}
