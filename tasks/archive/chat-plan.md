# Plan : module chat

Spec : `SPEC-chat.md` (validée le 24/10/2026). Plan précédent : `tasks/archive/cli-bridge-plan.md`.

## Vue d'ensemble
Fenêtre principale : barre latérale multi-sessions, réponses en direct en Markdown, lignes d'outils, bouton Stop.
On s'appuie sur `window.claude` (cli-bridge), qu'on étend avec `tool-use`, `pickFolder` et `interrupt`.

## Décisions d'architecture
- **État = reducer pur** (`state/sessions.ts`) : `(état, action) → état`. Les `BridgeEvent` sont des actions comme les autres → tout se teste avec Vitest, sans interface.
- **Un seul abonnement** `window.claude.onEvent` dans `app.tsx`, qui dispatch au reducer (pas d'abonnement par composant).
- **Interrupt en 1er** (risque le plus fort) : si la requête de contrôle stdin ne marche pas, repli kill + `--resume` (même `sessionId`).
- **Markdown sans HTML brut** : `react-markdown` n'interprète pas le HTML par défaut, on n'ajoute pas `rehype-raw`.

## Graphe de dépendances
```
T1 interrupt ─┐
T2 tool-use ──┼─→ T4 reducer ─→ T5 tranche 1 session ─→ T6 sidebar
T3 pickFolder ┘                                      ├─→ T7 Markdown
                                                     ├─→ T8 lignes d'outils (T2)
                                                     └─→ T9 Stop + erreurs (T1)
```

## Phases
1. **Pont étendu** (T1–T3) : main/preload, testé par Vitest + faux CLI.
2. **Première tranche** (T4–T5) : une session qui marche de bout en bout.
3. **Complet** (T6–T9) : multi-sessions, Markdown, outils, Stop.

Détail des tâches et critères : `tasks/todo.md`.

## Risques
| Risque | Impact | Parade |
|---|---|---|
| `interrupt` non supporté en `-p` stream-json | Moyen | Repli kill + `--resume` (T1) |
| Rendu Markdown lent sur gros flux (re-rendu à chaque delta) | Faible | Mesurer en T7 ; si lent, regrouper les deltas par frame |
| ~35 s avant le 1er morceau | Faible | Afficher « Claude démarre… » (T5) |
| Deps Markdown ESM-only vs build | Faible | Vérifier `npm run build` en T7 |

## Questions ouvertes
- Aucune bloquante (la question `interrupt` est traitée par T1).
