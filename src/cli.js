#!/usr/bin/env node
// jo-workflow: creates and maintains an AI agent harness (.harness/) and
// renders it for Claude Code, OpenCode and Codex.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { exists, write, json, readJson, walk } from "./util.js";
import { Project, defaultManifest, loadCatalog, readItems, itemPath, CATALOG, GENERATOR_ROOT, SYSTEMS, KINDS, KIND_DIRS, HOOK_EVENTS } from "./project.js";
import { detectStacks, applyStacks } from "./stacks.js";
import { sync } from "./sync.js";
import { upgrade, adopt, installFromCatalog } from "./maintain.js";
import { overview, commandHelp, suggest } from "./help.js";

const VERSION = readJson(path.join(GENERATOR_ROOT, "package.json"), {}).version || "dev";

// Installed by `init --minimal`; `init` installs the whole catalog.
const MINIMAL = {
  skill: ["dev", "implement-feature", "bug-hunt", "code-review", "unit-tests", "remember", "harness-maintenance"],
  agent: ["planner", "reviewer"],
  hook: ["session-context", "guard-shell", "protect-files"],
  memory: ["project", "conventions", "workflow", "decisions", "lessons"],
  loop: ["fix-until-green"],
  workflow: ["feature", "bugfix", "quick"],
};

class UsageError extends Error {}

function unknownCommand(name) {
  const close = suggest(name);
  return `unknown command '${name}'${close ? ` - did you mean '${close}'?` : ""} (run 'jo-workflow help')`;
}

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const opts = { _: [] };
  const valued = { "--dir": "dir", "-d": "dir", "--systems": "systems", "--name": "name", "--system": "system", "--max": "max" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (valued[a]) {
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      opts[valued[a]] = argv[++i];
    } else if (a.startsWith("--") && a.includes("=")) {
      const [k, v] = a.slice(2).split(/=(.*)/);
      opts[k] = v;
    } else if (a === "-y" || a === "--yes") opts.yes = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-v" || a === "--version") opts.version = true;
    else if (a === "-f" || a === "--force") opts.force = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--minimal") opts.minimal = true;
    else if (a === "--catalog") opts.catalog = true;
    else if (a === "--override") opts.override = true;
    else if (a === "--add-new") opts.addNew = true;
    else if (a.startsWith("-")) throw new UsageError(`unknown option '${a}' (see --help)`);
    else opts._.push(a);
  }
  return opts;
}

function parseSystems(value) {
  const list = String(value).split(/[\s,]+/).filter(Boolean).flatMap((s) => (s === "all" ? SYSTEMS : [s]));
  for (const s of list) if (!SYSTEMS.includes(s)) throw new UsageError(`unknown system '${s}' (expected ${SYSTEMS.join(", ")} or all)`);
  return SYSTEMS.filter((s) => list.includes(s));
}

const interactive = (opts) => !opts.yes && process.stdin.isTTY;

async function ask(question, fallback) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${question} [${fallback}]: `)).trim();
  rl.close();
  return answer || fallback;
}

// ---------------------------------------------------------------- reporting

function printReport(r, { dryRun }) {
  if (r.problems.length) {
    console.error("Invalid harness:");
    for (const p of r.problems) console.error(`  - ${p}`);
    return 1;
  }
  const verb = dryRun ? "would " : "";
  for (const f of r.created) console.log(`  ${verb}create  ${f}`);
  for (const f of r.updated) console.log(`  ${verb}update  ${f}`);
  for (const f of r.merged) console.log(`  ${verb}merge   ${f}`);
  for (const f of r.deleted) console.log(`  ${verb}delete  ${f}`);
  for (const c of r.conflicts) {
    const hint = c.reason === "modified by hand" ? "'adopt' it to keep the change, or --force to overwrite" : "use --force to overwrite";
    console.log(`  keep    ${c.path} (${c.reason}; ${hint})`);
  }
  for (const f of r.orphans) console.log(`  keep    ${f} (no longer generated but modified by hand; delete it yourself)`);
  for (const w of r.warnings) console.log(`  warning ${w}`);
  const changes = r.created.length + r.updated.length + r.merged.length + r.deleted.length;
  console.log(changes ? `${dryRun ? "Pending" : "Done"}: ${changes} change(s), ${r.conflicts.length} file(s) kept.` : "Up to date.");
  return 0;
}

const runSync = (project, opts, forcePaths) => printReport(sync(project, { force: opts.force, dryRun: opts.dryRun, forcePaths }), opts);

// ---------------------------------------------------------------- elements

const targetOf = (project, kind, name) => itemPath(project.harness, kind, name);

function scaffold(kind, name) {
  switch (kind) {
    case "skill":
      return {
        "SKILL.md": `---\nname: ${name}\ndescription: "TODO: what this skill does and when to use it, with trigger phrases."\ncategory: custom\nuser-invocable: true\nargument-hint: "[what to work on]"\n---\n# ${name}\n\n## When to use\n\nTODO\n\n## Steps\n\n1. TODO\n2. Run {{commands.test}} and fix failures.\n\n## Done when\n\n- TODO\n`,
      };
    case "agent":
      return `---\nname: ${name}\ndescription: "TODO: when the main agent should delegate to ${name}."\ntools: [read, search]\n---\nYou are the ${name} of this project.\n\nTODO: responsibilities, method, output format, what you must not do.\n`;
    case "memory":
      return `---\ntitle: ${name}\norder: 70\nload: reference\n---\n## ${name}\n\nTODO\n`;
    case "loop":
      return `---\nname: ${name}\ndescription: "TODO: what this loop achieves."\nuntil: test\nmax-iterations: 10\n---\nTODO: the task to perform at each iteration.\n\nMake one focused change per iteration. Never disable or skip checks to make them pass.\n`;
    case "workflow":
      return `---\nname: ${name}\ndescription: "TODO: the kind of task this workflow handles."\n---\n# ${name}\n\nPhases run in order by the \`dev\` orchestrator. [gate] = stop for approval in guided autonomy.\nCheck names refer to the project commands (project memory / .harness/harness.json).\n\n## 1. Understand\n- Use: TODO skill or agent\n- Do: TODO\n- Done when: TODO\n\n## 2. Plan [gate]\n- Use: agent \`planner\`\n- Done when: steps written in the task file.\n\n## 3. Do\n- Use: TODO\n- Check: test, lint\n\n## 4. Review and close [gate]\n- Use: skill \`code-review\`, skill \`remember\`\n- Done when: findings fixed, task summary written.\n`;
    case "hook":
      return {
        "hook.json": json({ description: "TODO", event: "after-edit", blocking: false, timeout: 60 }),
        "run.mjs": `// ${name}: receives the neutral hook payload on stdin (see docs/FORMAT.md).\n// Events: ${HOOK_EVENTS.join(", ")}.\n// exit 0 = ok (stdout becomes context for session-start / prompt-submit), exit 2 = block (needs "blocking": true).\nimport fs from "node:fs";\n\nconst input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");\n// input: { event, system, cwd, tool, files, command, prompt, stop_active }\n`,
      };
  }
}

function addElement(project, kind, name, opts) {
  const dest = targetOf(project, kind, name);
  if (exists(dest) && !opts.force) throw new UsageError(`${kind} '${name}' already exists (${path.relative(project.root, dest)}); use --force to replace it`);
  if (readItems(CATALOG, kind).some((i) => i.name === name)) {
    project.recordCatalog(kind, name, installFromCatalog(project, kind, name));
    return "catalog";
  }
  if (kind === "skill" && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new UsageError(`skill names use lowercase letters, digits and single hyphens`);
  fs.rmSync(dest, { recursive: true, force: true });
  const content = scaffold(kind, name);
  if (typeof content === "string") write(dest, content);
  else for (const [f, c] of Object.entries(content)) write(path.join(dest, f), c);
  return "template";
}

// ---------------------------------------------------------------- commands

async function cmdInit(project, opts) {
  if (project.initialized && !opts.force) throw new UsageError(`${project.manifestPath} already exists; use 'sync', 'add' or 'system add' (or --force to re-init)`);
  fs.mkdirSync(project.root, { recursive: true });
  const fallbackName = path.basename(project.root);
  const name = opts.name || (interactive(opts) ? await ask("Project name", fallbackName) : fallbackName);
  const systems = parseSystems(opts.systems || (interactive(opts) ? await ask("Systems: claude,opencode,codex or all", "all") : "all"));
  if (!systems.length) throw new UsageError("at least one system is required");

  const manifest = applyStacks({ ...defaultManifest(name), systems }, detectStacks(project.root));
  write(project.manifestPath, json(manifest));

  const catalog = loadCatalog();
  let count = 0;
  for (const kind of KINDS) {
    for (const item of catalog[kind]) {
      if (opts.minimal && !MINIMAL[kind].includes(item.name)) continue;
      if (exists(targetOf(project, kind, item.name))) continue;
      addElement(project, kind, item.name, {});
      count++;
    }
  }
  console.log(`Initialized .harness/ for '${name}' (${systems.join(", ")}): ${count} element(s), stack: ${manifest.stack.join(", ") || "not detected"}`);
  if (!manifest.stack.length) console.log("  No stack detected: fill .harness/harness.json 'commands' later, or run 'jo-workflow detect'.");
  return runSync(project, opts);
}

function cmdAdd(project, [kind, name], opts) {
  if (!KINDS.includes(kind) || !name) throw new UsageError(`usage: add <${KINDS.join("|")}> <name>`);
  const source = addElement(project, kind, name, opts);
  console.log(`Added ${kind} '${name}' from ${source}: ${path.relative(project.root, targetOf(project, kind, name))}`);
  return runSync(project, opts);
}

function cmdRemove(project, [kind, name], opts) {
  if (!KINDS.includes(kind) || !name) throw new UsageError(`usage: remove <${KINDS.join("|")}> <name>`);
  const target = targetOf(project, kind, name);
  if (!exists(target)) throw new UsageError(`${kind} '${name}' is not installed`);
  fs.rmSync(target, { recursive: true });
  project.recordCatalog(kind, name, null);
  console.log(`Removed ${kind} '${name}'.`);
  return runSync(project, opts);
}

function cmdList(project, opts) {
  const catalog = loadCatalog();
  const installed = project.initialized ? project.items() : null;
  if (!opts.catalog && !installed) throw new UsageError("no harness here; use 'list --catalog' or 'init'");
  for (const kind of KINDS) {
    const names = new Set((installed?.[kind] || []).map((i) => i.name));
    const items = opts.catalog ? catalog[kind] : installed[kind];
    console.log(`\n${KIND_DIRS[kind]} (${items.length})`);
    for (const i of items) {
      const mark = opts.catalog && installed ? (names.has(i.name) ? "* " : "  ") : "";
      const desc = String(i.data.description || i.data.title || "").split(/(?<=\.)\s/)[0];
      console.log(`  ${mark}${i.name.padEnd(22)} ${desc}`);
    }
  }
  if (opts.catalog && installed) console.log("\n* = installed");
  return 0;
}

function cmdSystem(project, [action, name], opts) {
  if (!["add", "remove"].includes(action) || !name) throw new UsageError("usage: system add|remove <claude|opencode|codex>");
  const manifest = readJson(project.manifestPath, null);
  const systems = new Set(manifest.systems);
  for (const s of parseSystems(name)) action === "add" ? systems.add(s) : systems.delete(s);
  if (!systems.size) throw new UsageError("at least one system must stay enabled");
  manifest.systems = SYSTEMS.filter((s) => systems.has(s));
  write(project.manifestPath, json(manifest));
  console.log(`Systems: ${manifest.systems.join(", ")}`);
  return runSync(project, opts);
}

function cmdDetect(project, opts) {
  const manifest = readJson(project.manifestPath, null);
  manifest.commands ||= {};
  manifest.formatters ||= {};
  const stacks = detectStacks(project.root);
  applyStacks(manifest, stacks);
  write(project.manifestPath, json(manifest));
  console.log(`Stack: ${manifest.stack.join(", ") || "not detected"}`);
  for (const [k, v] of Object.entries(manifest.commands)) console.log(`  ${k.padEnd(17)} ${v || "-"}`);
  return runSync(project, opts);
}

function cmdUpgrade(project, opts) {
  const r = upgrade(project, { force: opts.force, dryRun: opts.dryRun, addNew: opts.addNew });
  const verb = opts.dryRun ? "would upgrade" : "upgrade";
  for (const k of r.updated) console.log(`  ${verb}  ${k}`);
  for (const k of r.added) console.log(`  ${opts.dryRun ? "would add" : "add"}      ${k}`);
  for (const k of r.modified) console.log(`  keep     ${k} (changed in .harness/; --force replaces it with the catalog version)`);
  if (r.available.length) console.log(`  new in catalog (install with 'add <kind> <name>' or 'upgrade --add-new'): ${r.available.join(", ")}`);
  console.log(`${r.updated.length} upgraded, ${r.added.length} added, ${r.current.length} already current, ${r.modified.length} kept, ${r.custom.length} custom.`);
  if (opts.dryRun) return 0;
  return runSync(project, opts);
}

function cmdAdopt(project, paths, opts) {
  if (!paths.length) throw new UsageError("usage: adopt <generated-file>... [--override]");
  const r = adopt(project, paths, { override: opts.override });
  for (const a of r.adopted) console.log(`  adopt   ${a.path} -> ${a.into}`);
  for (const s of r.skipped) console.log(`  skip    ${s.path} (${s.reason})`);
  if (!r.adopted.length) return r.skipped.length ? 1 : 0;
  console.log("Review the result with 'git diff .harness' (placeholders are restored where the source used them).");
  return runSync(project, { ...opts, force: false }, r.forcePaths);
}

function cmdLoop(project, [name], opts) {
  if (!name) throw new UsageError("usage: loop <name> [--system S] [--max N] [--dry-run]");
  const runner = path.join(project.harness, "runtime", "loop.mjs");
  if (!exists(runner)) throw new UsageError("loop runner missing; run 'jo-workflow sync' first");
  const args = [runner, name];
  if (opts.system) args.push("--system", opts.system);
  if (opts.max) args.push("--max", opts.max);
  if (opts.dryRun) args.push("--dry-run");
  return spawnSync(process.execPath, args, { cwd: project.root, stdio: "inherit" }).status ?? 1;
}

// ---------------------------------------------------------------- main

export async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.version) return console.log(`jo-workflow ${VERSION}`), 0;
  const [command, ...rest] = opts._;
  const project = new Project(path.resolve(opts.dir || "."));

  // `help <cmd>`, `<cmd> --help`, bare `help`/`--help`, or no command at all.
  const helpTopic = command === "help" ? rest[0] : opts.help ? command : undefined;
  if (command === "help" || opts.help || !command) {
    if (!helpTopic) return console.log(overview(VERSION, project)), 0;
    const text = commandHelp(helpTopic);
    if (!text) throw new UsageError(unknownCommand(helpTopic));
    return console.log(text), 0;
  }

  const needsHarness = (fn) => {
    if (!project.initialized) throw new UsageError(`no harness in ${project.root}; run 'jo-workflow init' first`);
    return fn();
  };
  switch (command) {
    case "init":
      return cmdInit(project, opts);
    case "add":
      return needsHarness(() => cmdAdd(project, rest, opts));
    case "remove":
      return needsHarness(() => cmdRemove(project, rest, opts));
    case "list":
      return cmdList(project, opts);
    case "system":
      return needsHarness(() => cmdSystem(project, rest, opts));
    case "sync":
      return needsHarness(() => runSync(project, opts));
    case "status":
      return needsHarness(() => runSync(project, { ...opts, dryRun: true }));
    case "upgrade":
      return needsHarness(() => cmdUpgrade(project, opts));
    case "adopt":
      return needsHarness(() => cmdAdopt(project, rest, opts));
    case "detect":
      return needsHarness(() => cmdDetect(project, opts));
    case "loop":
      return needsHarness(() => cmdLoop(project, rest, opts));
    default:
      throw new UsageError(unknownCommand(command));
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code ?? 0))
  .catch((e) => {
    console.error(`Error: ${e.message}`);
    if (!(e instanceof UsageError) && process.env.DEBUG) console.error(e.stack);
    process.exit(1);
  });
