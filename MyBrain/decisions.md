---
type: project
project: bk-emerainville
status: active
tags: [firebase, adr, decisions]
parent: "[[BKEmerainville/spec]]"
---

# BKEmerainville — Décisions

## Format ADR
**Contexte** → **Décision** → **Conséquences**

---

## ADR-001 — Sécurisation via Cloud Functions

**Contexte** : Règles Firestore initiales `allow read, write: if true` → n'importe qui pouvait supprimer ou falsifier les réservations.

**Décision** : Opérations destructives (supprimer resa, modifier resa, reset) déplacées vers Cloud Functions callable. Vérification admin côté serveur via `context.auth.token.email`. Règles Firestore : lecture libre + création/update seulement côté client.

**Conséquences** : Nécessite plan Firebase Blaze. Projet migré Spark → Blaze le 2026-05-03.

---

## ADR-003 — Dossier MyBrain/ + hook pre-commit sync Obsidian

**Contexte** : Fichiers Obsidian du projet (`spec.md`, `decisions.md`, `todo.md`, etc.) isolés dans le vault. Besoin de les versionner dans le repo pour avoir l'historique avec le code.

**Décision** : Dossier `MyBrain/` à la racine du repo contenant des copies des fichiers `10-Projets/bk-animation/` (sans `*Git.md`). Hook `hooks/pre-commit` recopie depuis le vault avant chaque commit → copies toujours fraîches.

**Conséquences** : Fichiers versionnés dans git. Éditer dans Obsidian = source de vérité. Pas de sync automatique hors commit.

---

## ADR-002 — Dev/Prod via Firebase Emulator

**Contexte** : Besoin de tester sans toucher les données prod.

**Décision** : Firebase Emulator (Auth + Functions + Firestore + Hosting). Auto-détection via `IS_DEV = hostname === "localhost" || hostname === "127.0.0.1"` dans `config.js`. Aucun changement de code entre dev et prod.

**Conséquences** : Nécessite Java installé (`brew install --cask temurin`). Lancer avec `firebase emulators:start`.

---
