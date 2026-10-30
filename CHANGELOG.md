# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions : [SemVer](https://semver.org/lang/fr/).

## [0.3.0] - 2026-10-30

Première version sous le nom **jo-workflow** (package `@jow/cli`).

### Changements incompatibles
- L'outil s'appelle `jo-workflow` : lanceurs `jo-workflow.bat` et `jo-workflow.sh`.
- Le dossier source des projets passe de `.harness/` à `.jow/`, et le plugin OpenCode
  devient `.opencode/plugins/jow-hooks.js`. Un projet resté en `.harness/` reçoit la marche
  à suivre (`git mv .harness .jow`, `upgrade`, `sync`), voir le README.

### Ajouts
- Orchestrateur `dev` (`/dev <demande>`, `$dev` sous Codex) et workflows feature, bugfix,
  refactor, migration, research, testing, generation, bootstrap et quick ; suivi des tâches
  dans `.jow/work/` ; réglages `orchestrator.trigger` et `orchestrator.autonomy`.
- `upgrade` : met à jour les éléments installés depuis le catalogue sans toucher à ceux
  modifiés par le dev (`--add-new`, `--force`, `--dry-run`).
- `adopt` : rapatrie dans `.jow/` une modification faite dans un fichier généré, ou la fige
  dans `.jow/overrides/` (`--override`).
- Aide contextuelle (`jo-workflow` sans argument), aide par commande et suggestion en cas
  de faute de frappe.
- Logo JO-W et description « automatisation des manuels » dans l'aide et en tête des
  fichiers générés.
- Licence MIT, auteur RPA.

### Corrections
- Un fichier JSON enregistré avec un BOM UTF-8 (PowerShell 5.1, Bloc-notes) est lu correctement.

## [0.2.0]

Version interne sous le nom `workflow-generator` : moteur Node.js, format neutre,
`sync` vers Claude Code, OpenCode et Codex, détection de stack, catalogue de skills,
agents, hooks, memory et loops.
