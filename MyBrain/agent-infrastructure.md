---
type: note
project: bk-emerainville
tags: [claude-code, agents, infrastructure]
parent: "[[BKEmerainville/spec]]"
created: 2026-05-07
---

# BKEmerainville — Infrastructure Agents Claude Code

## Ce qui a été mis en place

Via la commande `/setup-matt-pocock-skills` dans Claude Code.

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `AGENTS.md` | Point d'entrée — explique aux agents où trouver la config |
| `docs/agents/domain.md` | Comment les agents lisent `CONTEXT.md` et les ADRs |
| `docs/agents/issue-tracker.md` | Issues sur GitHub (`github.com/raviet/bk-animation`) |
| `docs/agents/triage-labels.md` | Labels : `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` |

### Pourquoi

Permet aux agents AI (Claude Code, agents parallèles) de :
- Comprendre le domaine métier avant d'explorer le code
- Créer/trier des issues GitHub avec le bon vocabulaire
- Travailler de façon autonome sur des tâches préparées (`ready-for-agent`)

### Workflow cible

1. Nouvelle feature ou bug → triage via `/triage`
2. Issue créée avec label `ready-for-agent`
3. Agent dispatché sur l'issue
4. Review humaine → merge

## Repo GitHub

`github.com/raviet/bk-animation`
