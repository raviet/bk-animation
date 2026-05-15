---
type: project
project: bk-emerainville
status: active
tags: [todo, firebase, web]
parent: "[[BKEmerainville/spec]]"
---

# BKEmerainville — Todo

## En cours
- [ ] Tests sur mobile / responsive

## À faire
- [ ] Gestion multi-semaines (actuellement fixé sur doc `courante`)
- [ ] Confirmation par email après réservation
- [ ] Export liste des réservations (PDF ou CSV)
- [ ] Numéro de téléphone dans le formulaire de réservation
- [x] Upgrade Node.js runtime 20 → 22 dans `functions/package.json`

## Fait
- [x] Infrastructure agents Claude Code — `AGENTS.md` + `docs/agents/` (voir [[agent-infrastructure]])
- [x] Structure projet Firebase Hosting + Firestore
- [x] Page client `index.html` — sélection créneau + formulaire réservation
- [x] Transaction Firestore anti-doublon (max 10 enfants/créneau)
- [x] Page admin `admin.html` — auth Google + email/password
- [x] Admin : liste réservations par créneau, modifier, supprimer
- [x] Admin : reset toutes les réservations
- [x] Accès admin restreint par liste email (`ADMINS`)
- [x] Cloud Functions pour opérations destructives (supprimerResa, modifierResa, resetAll)
- [x] Règles Firestore sécurisées — delete impossible côté client
- [x] Auto-détection dev/prod via `IS_DEV` dans `config.js`
- [x] Firebase Emulator configuré (Auth + Functions + Firestore + Hosting)
- [x] Déployé en prod — plan Blaze activé
