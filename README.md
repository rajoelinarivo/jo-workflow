# workflow-generator

Génère et maintient le harnais d'agents IA d'un projet (skills, subagents, hooks,
memory, loops) pour **Claude Code**, **OpenCode** et **Codex**, quel que soit le stack.

La source de vérité vit dans le projet, dans `.harness/` (format neutre, voir
[docs/FORMAT.md](docs/FORMAT.md)). `sync` la traduit dans les fichiers de chaque système.
Un fichier généré modifié à la main n'est jamais écrasé sans `--force`.

- `upgrade` : quand le catalogue du générateur évolue, met à jour les éléments installés,
  sauf ceux que le dev a modifiés dans `.harness/` (`--force` pour les remplacer aussi).
- `adopt <fichier>` : garde une modification faite directement dans un fichier généré.
  - Un skill ou un agent repart dans sa source `.harness/`, avec les placeholders restaurés,
    et la modification atteint donc tous les systèmes.
  - `.codex/config.toml`, ou tout fichier passé avec `--override`, devient une surcharge
    dans `.harness/overrides/`.
  - `AGENTS.md` et `CLAUDE.md` sont refusés : leur contenu se change dans `.harness/memory/`.

## Point d'entrée : l'orchestrateur `/dev`

Le dev peut lancer `/dev <demande>` (`$dev <demande>` sous Codex). L'orchestrateur :
- choisit un workflow (feature, bugfix, refactor, migration, research, testing,
  generation, bootstrap ou quick) ;
- suit la tâche dans `.harness/work/` ;
- enchaîne les phases en s'appuyant sur les skills et les agents, avec validation du dev
  aux étapes clés.

`/dev` sans argument reprend la tâche en cours, même depuis un autre outil.

- Par défaut (`orchestrator.trigger: auto`), toute demande de développement passe par
  l'orchestrateur, même sans taper `/dev`.
- Appeler directement un skill (`/bug-hunt`, `/refactor`…) ou un agent court-circuite
  l'orchestrateur.
- L'autonomie se règle dans `.harness/harness.json` (`orchestrator.autonomy`) :
  - `guided` : validation après le plan et à la fin ;
  - `step` : validation à chaque phase ;
  - `auto` : arrêt seulement en cas de blocage.

## Prérequis et installation

- Node.js 18 ou plus récent (aucune dépendance npm).
- Lancer `workflow-generator.bat` (Windows) ou `workflow-generator.sh` (Linux, macOS, Git Bash).
- Pour que les agents puissent aussi lancer `workflow-generator sync`, l'installer sur le PATH :
  `npm link` dans ce dossier.

## Utilisation

`workflow-generator` sans argument affiche l'aide. Dans un projet équipé, elle montre aussi
son état : systèmes, éléments, tâches ouvertes, fichiers à synchroniser. L'aide détaillée
d'une commande s'obtient avec `workflow-generator help <commande>` ou `<commande> --help`.

```sh
workflow-generator init --systems claude,opencode   # crée .harness/ et génère tout
workflow-generator add skill perf-audit             # nouveau skill, généré pour chaque système actif
workflow-generator add hook format-on-edit          # élément du catalogue
workflow-generator remove skill benchmark
workflow-generator system add codex                 # active un système de plus
workflow-generator sync                             # après avoir modifié .harness/
workflow-generator status                           # ce que sync changerait
workflow-generator upgrade                          # met à jour depuis le catalogue ce que le dev n'a pas modifié
workflow-generator adopt .claude/skills/x/SKILL.md  # rapatrie une modif faite à la main vers .harness/
workflow-generator detect                           # détecte le stack, remplit les commandes vides
workflow-generator loop fix-until-green             # itère en mode headless jusqu'à ce que les tests passent
workflow-generator list --catalog
```

Options globales : `--dir DIR`, `--yes`, `--force`, `--dry-run`, `--minimal` (init).

## Ce qui est généré

| Élément neutre        | Claude Code                         | OpenCode                               | Codex                         |
|-----------------------|-------------------------------------|----------------------------------------|-------------------------------|
| `memory/*.md`         | `CLAUDE.md` (`@AGENTS.md`)          | `AGENTS.md`                            | `AGENTS.md`                   |
| `skills/<n>/`         | `.claude/skills/<n>/`               | lit `.claude/skills` ou `.agents/skills` + `.opencode/commands/<n>.md` | `.agents/skills/<n>/` |
| `agents/<n>.md`       | `.claude/agents/<n>.md`             | `.opencode/agents/<n>.md`              | `.codex/agents/<n>.toml`      |
| `hooks/<n>/`          | `.claude/settings.json` (fusion)    | `.opencode/plugins/harness-hooks.js`   | `.codex/hooks.json`           |
| `harness.json` permissions | `.claude/settings.json` (fusion) | `opencode.json` (fusion)              | `.codex/config.toml`          |
| `loops/<n>.md`        | `claude -p`                         | `opencode run`                         | `codex exec`                  |

Les hooks sont écrits une seule fois en Node (`run.mjs`). Le pont
`.harness/runtime/bridge.mjs` traduit le payload de chaque système vers un format commun.

## Catalogue

- **Skills** : project-bootstrap, implement-feature, code-generation, solution-research,
  bug-hunt, refactor, migration, unit-tests, integration-tests, golden-tests,
  regression-tests, benchmark, code-review, security-audit, documentation, remember,
  harness-maintenance.
- **Agents** : planner, reviewer, test-writer, researcher, debugger.
- **Hooks** :
  - session-context : contexte git et alerte si la source a changé depuis le dernier sync ;
  - guard-shell : bloque les commandes destructrices ;
  - protect-files : protège les secrets et les fichiers générés ;
  - format-on-edit : formate les fichiers modifiés ;
  - verify-on-stop : lance lint et typecheck avant que l'agent s'arrête.
- **Memory** : project, conventions, workflow, architecture, decisions, lessons.
- **Loops** : fix-until-green, lint-clean, typecheck-clean, migrate-step (checklist `MIGRATION.md`).
- **Orchestrateur** : skill `dev`, avec les workflows feature, bugfix, refactor, migration,
  research, testing, generation, bootstrap et quick.

## Structure de ce dépôt

```
src/        moteur (cli, détection de stack, rendu par système, sync)
runtime/    copié dans .harness/runtime/ de chaque projet (pont des hooks, loops)
catalog/    éléments neutres installables
docs/       FORMAT.md : contrat du format neutre
```
