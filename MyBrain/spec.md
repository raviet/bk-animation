---
type: project
project: bk-emerainville
status: active
tags:
  - firebase
  - web
  - javascript
  - burger-king
git: "[[BKEmerainvilleGit]]"
todo: "[[BKEmerainville/todo]]"
decisions: "[[BKEmerainville/decisions]]"
commands: "[[commandsDev]]"
---

# BKEmerainville — Spec

## Objectif

Web app pour structurer et gérer le restaurant Burger King Emerainville.

## Périmètre

### ✅ En cours — Gestion des animations enfants
- Groupes de 10 enfants max par créneau
- Créneaux : samedi et dimanche après-midi
- Réservation / gestion des groupes par créneau

### 🔜 À venir
- À définir

## Stack technique

- **Frontend** : HTML / CSS / JS vanilla (pas de framework)
- **Backend** : Firebase Firestore (BDD) + Firebase Hosting + Firebase Auth
- **Firebase project** : `bkanimationemerainville`
- **Config** : `/Projet/bk-animation`

### Pages
| Fichier | Rôle |
|---|---|
| `index.html` | Réservation côté client |
| `admin.html` | Gestion admin des créneaux |

### Logique métier
- 10 places par créneau (`PLACES = 10`)
- Créneaux : 14h-15h, 15h-16h, 16h-17h, 17h-18h
- Jours : Samedi + Dimanche
- Collection Firestore : `semaine/{doc}`

## Liens utiles

- Firebase console : https://console.firebase.google.com/project/bkanimationemerainville


