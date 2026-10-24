# Plan : module model

Spec : `SPEC-model.md`. Méthode : TDD, 1 commit par tâche (sans Co-Authored-By, sans `.claude/`).

## Décisions d'architecture
- Le modèle choisi est une simple chaîne (`'opus' | 'sonnet' | 'haiku'`) ou `undefined` pour « Par défaut ». Le type et la liste des choix vont dans `src/shared/model.ts`, partagé entre main et renderer.
- Changement en cours = `SessionManager.restart(id, model)` : `stop` puis `start(cwd, id, model)`. Le main retient le `cwd` de chaque session pour pouvoir la relancer.
- **Piège** : la fin (`exit`) de l'ancien processus arrive *après* le lancement du nouveau, qui porte le même id. Les écouteurs `exit`, `error` et `stdout` doivent donc vérifier `this.sessions.get(id) === child` avant d'agir. Sinon, ils effacent la nouvelle session ou affichent une fausse erreur (taskkill /F renvoie le code 1).
- Le modèle réellement utilisé vient de `system/init` (champ `model`, présent dans la fixture `stream-bonjour.jsonl`). Il n'est pas déduit du choix.
- Le dernier choix est stocké dans `localStorage`, comme les commandes et les jauges dans `app.tsx`.
- La reprise d'une session depuis l'historique n'existe pas dans l'app (history est en lecture seule) : rien à faire pour ce cas de la spec.

## Graphe des dépendances
```
shared/model.ts ─┬─ T1 args + start(model) + IPC start
                 ├─ T2 événement init → modèle affiché
                 └─ T3 restart (main) + IPC setModel
                          └─ T4 liste déroulante + dernier choix
                                   └─ T5 passation garde le modèle
                                            └─ T6 vérification dans la vraie app
```

## Tâches
- **T1 (S)** : `--model` au lancement. Concerne `claude-args.ts`, `session-manager.start`, l'IPC et le preload (`startSession(cwd, { resumeId?, model? })`).
- **T2 (M)** : le parseur émet `{ type: 'model' }` à la réception de `init` → le reducer stocke `activeModel` → l'en-tête du chat affiche le modèle.
- **T3 (M)** : `restart` avec garde d'identité du processus, plus l'IPC `session:set-model`. Testé avec le faux CLI.
- **T4 (M)** : `model-picker.tsx` dans l'en-tête, grisé pendant un tour. Le dernier choix est lu et écrit (fonctions pures testées). Une nouvelle session part avec ce choix, et un changement appelle `setModel`.
- **T5 (S)** : la session neuve d'une passation reprend le `model` de la session résumée.
- **T6** : checkpoint dans la vraie app (CDP, comme pour handoff P5).

## Risques
| Risque | Impact | Parade |
|---|---|---|
| Ancien processus qui écrase le nouveau (même id) | Haut | Garde `sessions.get(id) === child` + test dédié en T3 |
| `--resume` alors que le `.jsonl` est encore ouvert par l'ancien processus | Moyen | `killTree` est synchrone (spawnSync taskkill) ; vérifié en T6 |
| L'alias `haiku` refusé par l'abonnement | Bas | Le CLI renvoie une erreur → affichée comme les autres erreurs ; vérifié en T6 |

## Questions ouvertes
Aucune.
