// Help screens: a context-aware overview (bare `jo-workflow` or --help) and
// per-command help (`help <command>` or `<command> --help`).
import fs from "node:fs";
import path from "node:path";
import { KINDS, SYSTEMS } from "./project.js";
import { sync } from "./sync.js";

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = paint("1");
const dim = paint("2");
const cyan = paint("36");
const green = paint("32");
const yellow = paint("33");

const KIND_LIST = KINDS.join("|");

export const COMMANDS = [
  {
    name: "init",
    group: "Start",
    usage: "init [--systems LIST] [--name NAME] [--minimal]",
    summary: "Create .harness/ from the catalog and generate every system's files",
    details: "Detects the stack (Node, Python, Go, Rust, Java, .NET, PHP, Ruby, ...) to fill the project commands, installs the catalog into .harness/ and runs sync. Asks for the name and systems when they are not given and the terminal is interactive.",
    options: [
      ["--systems LIST", `${SYSTEMS.join(",")} or all (default: asked, or all with --yes)`],
      ["--name NAME", "project name (default: folder name)"],
      ["--minimal", "install a core subset: dev orchestrator, 3 workflows, essential skills, agents and hooks"],
      ["--force", "re-initialize a project that already has .harness/"],
    ],
    examples: ["init", "init --systems claude,opencode --minimal --yes", "init --dir ../my-app --systems all"],
  },
  {
    name: "add",
    group: "Elements",
    usage: `add <${KIND_LIST}> <name>`,
    summary: "Add an element from the catalog, or a blank template for a new name",
    details: "The element is written to .harness/ then rendered for every enabled system: a skill added once reaches Claude Code, OpenCode and Codex.",
    options: [["--force", "replace an element that already exists"]],
    examples: ["add skill perf-audit", "add workflow release", "add hook format-on-edit"],
  },
  {
    name: "remove",
    group: "Elements",
    usage: `remove <${KIND_LIST}> <name>`,
    summary: "Remove an element and the files generated from it",
    examples: ["remove skill benchmark"],
  },
  {
    name: "list",
    group: "Elements",
    usage: "list [--catalog]",
    summary: "List installed elements, or the whole catalog (* = installed)",
    examples: ["list", "list --catalog"],
  },
  {
    name: "system",
    group: "Systems and generation",
    usage: `system add|remove <${SYSTEMS.join("|")}>`,
    summary: "Enable or disable a target system",
    details: "Disabling a system deletes its generated files (except files modified by hand).",
    examples: ["system add codex", "system remove opencode"],
  },
  {
    name: "sync",
    group: "Systems and generation",
    usage: "sync [--dry-run] [--force]",
    summary: "Render .harness/ into the files of each enabled system",
    details: "Run it after editing anything in .harness/. Files modified by hand are kept and reported; adopt them or overwrite them with --force.",
    options: [
      ["--dry-run", "show what would change"],
      ["--force", "overwrite files modified by hand"],
    ],
    examples: ["sync", "sync --dry-run"],
  },
  {
    name: "status",
    group: "Systems and generation",
    usage: "status",
    summary: "Show what sync would change (same as sync --dry-run)",
  },
  {
    name: "detect",
    group: "Systems and generation",
    usage: "detect",
    summary: "Detect the stack and fill empty commands in .harness/harness.json",
    details: "Never overwrites a command that is already set.",
  },
  {
    name: "upgrade",
    group: "Maintenance",
    usage: "upgrade [--dry-run] [--add-new] [--force]",
    summary: "Update installed elements from the generator's catalog",
    details: "Only elements still identical to the catalog version they were installed from are replaced; elements you changed in .harness/ are kept.",
    options: [
      ["--dry-run", "show what would be upgraded"],
      ["--add-new", "also install catalog elements not installed yet"],
      ["--force", "also replace elements you changed"],
    ],
    examples: ["upgrade --dry-run", "upgrade --add-new"],
  },
  {
    name: "adopt",
    group: "Maintenance",
    usage: "adopt <generated-file>... [--override]",
    summary: "Keep hand edits made directly in generated files",
    details: "Skill and agent files go back to their .harness/ source, so the edit reaches every system. .codex/config.toml becomes an override in .harness/overrides/. AGENTS.md and CLAUDE.md are refused: edit .harness/memory/ instead.",
    options: [["--override", "freeze this file as-is (it will no longer receive updates)"]],
    examples: ["adopt .claude/skills/bug-hunt/SKILL.md", "adopt .codex/config.toml"],
  },
  {
    name: "loop",
    group: "Run",
    usage: "loop <name> [--system S] [--max N] [--dry-run]",
    summary: "Run an agent headless until the loop's check passes",
    details: "Loops are defined in .harness/loops/. Each iteration runs claude -p, codex exec or opencode run with the loop prompt, then the check command.",
    options: [
      ["--system S", "claude, opencode or codex (default: first enabled system)"],
      ["--max N", "maximum number of iterations"],
      ["--dry-run", "print the command and prompt of the first iteration only"],
    ],
    examples: ["loop fix-until-green", "loop migrate-step --system codex --max 30"],
  },
  {
    name: "help",
    group: "Help",
    usage: "help [command]",
    summary: "Show this overview, or the detailed help of a command",
    examples: ["help adopt"],
  },
];

const GLOBAL_OPTIONS = [
  ["-d, --dir DIR", "project directory (default: current directory)"],
  ["-y, --yes", "never prompt, use defaults"],
  ["-h, --help", "show help (also after a command: add --help)"],
  ["-v, --version", "show the version"],
];

const table = (rows, width = Math.max(...rows.map(([a]) => a.length)), indent = "  ") => {
  return rows.map(([a, b]) => `${indent}${cyan(a.padEnd(width))}  ${b}`).join("\n");
};

/** Short state of the harness in `root`, or how to start when there is none. */
function projectState(project) {
  if (!project.initialized) {
    return [
      `${yellow("No harness in this directory.")} Start with:`,
      `  ${cyan("jo-workflow init")}            ${dim("# interactive")}`,
      `  ${cyan("jo-workflow init --yes")}      ${dim("# all systems, full catalog")}`,
    ].join("\n");
  }
  try {
    const manifest = project.manifest();
    const items = project.items();
    const label = (k, n) => (k === "memory" ? `${n} memory file${n === 1 ? "" : "s"}` : `${n} ${k}${n === 1 ? "" : "s"}`);
    const counts = KINDS.map((k) => label(k, items[k].length)).join(", ");
    const lines = [
      `${bold("Project")} ${manifest.name}  ${dim(project.root)}`,
      `  systems   ${manifest.systems.join(", ")}`,
      `  stack     ${manifest.stack.join(", ") || "not detected"}`,
      `  elements  ${counts}`,
    ];
    const workDir = path.join(project.harness, "work");
    const open = fs.existsSync(workDir)
      ? fs.readdirSync(workDir).filter((f) => f.endsWith(".md") && !/^status:\s*done/m.test(fs.readFileSync(path.join(workDir, f), "utf8")))
      : [];
    if (open.length) lines.push(`  tasks     ${open.length} open (resume with /dev): ${open.slice(0, 3).join(", ")}`);
    const r = sync(project, { dryRun: true });
    if (r.problems.length) lines.push(`  ${yellow("invalid")}   ${r.problems[0]}${r.problems.length > 1 ? ` (+${r.problems.length - 1})` : ""}`);
    else {
      const pending = r.created.length + r.updated.length + r.merged.length + r.deleted.length;
      const hand = r.conflicts.filter((c) => c.reason === "modified by hand").length;
      const state = pending ? yellow(`${pending} change(s) pending: run 'jo-workflow sync'`) : green("up to date");
      lines.push(`  files     ${state}${hand ? yellow(`, ${hand} modified by hand (see 'help adopt')`) : ""}`);
    }
    return lines.join("\n");
  } catch (e) {
    return `${yellow("Harness found but unreadable:")} ${e.message}`;
  }
}

export function overview(version, project) {
  const out = [
    `${bold("jo-workflow")} ${version} - agent harness for Claude Code, OpenCode and Codex`,
    "",
    projectState(project),
    "",
    `${bold("Usage")}  jo-workflow <command> [options]`,
  ];
  const groups = [...new Set(COMMANDS.map((c) => c.group))];
  const width = Math.max(...COMMANDS.map((c) => c.name.length));
  for (const g of groups) {
    out.push("", bold(g));
    out.push(table(COMMANDS.filter((c) => c.group === g).map((c) => [c.name, c.summary]), width));
  }
  out.push("", bold("Global options"), table(GLOBAL_OPTIONS));
  out.push(
    "",
    bold("In your agent"),
    `  ${cyan("/dev <request>")}  runs the whole workflow (Codex: $dev); ${cyan("/dev")} alone resumes the open task.`,
    `  Skills stay usable directly: /bug-hunt, /refactor, /unit-tests ...`,
    "",
    `Details on a command: ${cyan("jo-workflow help <command>")}`
  );
  return out.join("\n");
}

export function commandHelp(name) {
  const c = COMMANDS.find((x) => x.name === name);
  if (!c) return null;
  const out = [`${bold("jo-workflow " + c.usage)}`, "", c.summary + "."];
  if (c.details) out.push("", c.details);
  if (c.options?.length) out.push("", bold("Options"), table(c.options));
  if (c.examples?.length) out.push("", bold("Examples"), ...c.examples.map((e) => `  ${cyan("jo-workflow " + e)}`));
  out.push("", dim("Global options: --dir DIR, --yes. Overview: jo-workflow help"));
  return out.join("\n");
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Closest command name for a typo, or null. */
export function suggest(name) {
  const best = COMMANDS.map((c) => [c.name, distance(name, c.name)]).sort((x, y) => x[1] - y[1])[0];
  return best && best[1] <= 2 ? best[0] : null;
}
