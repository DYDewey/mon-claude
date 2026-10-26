# Plan : module search

Spec : `SPEC-search.md` (validée le 26/10/2026).

## Vue d'ensemble
Chercher dans le contenu des anciennes conversations depuis le champ de recherche de la barre latérale. main lit et garde en mémoire le texte de chaque `.jsonl` (lecture seule), le renderer affiche une section « Dans les conversations » et ouvre la session au message trouvé.

## Décisions d'architecture
- **Textes cherchés = `parseSession(lines).items`** (messages `user` et `assistant`) au lieu d'un nouvel extracteur : mêmes règles que la relecture (pas d'outils, pas de méta, pas de sous-agents), et l'index du message trouvé est exactement l'index de l'élément affiché par `ChatView`. Écart avec la spec : `extractTexts(lines)` devient `searchableTexts(items)`.
- `fold` sort de `ui-format.ts` vers `src/shared/search.ts` (exporté), `filterHistory` l'importe : une seule définition.
- Le champ de recherche vit dans `HistoryList` (état `query`) : la section résultats et l'attente de 300 ms y sont branchées, pas dans `app.tsx`. `onOpen(folder, id, focusIndex?)` remonte jusqu'à `openHistory`.
- Réponses en retard : un compteur de requêtes côté renderer ; seule la dernière est affichée.
- Index de recherche séparé du lecteur d'historique (cache différent : `size + mtimeMs`), mêmes règles de chemin (`readdir` sous la racine, `SAFE_NAME`).

## Tâches
- [x] S1 : fonctions pures `src/shared/search.ts` (+ tests)
- [x] S2 : index main `src/main/search-index.ts` (+ tests dossier temporaire)
- [x] S3 : IPC `searchHistory` (main, preload, api)
- Checkpoint A : tests, typecheck, lint verts
- [x] S4 : section « Dans les conversations » dans la barre latérale
- [x] S5 : clic → ouverture et défilement jusqu'au message surligné
- Checkpoint B : tests verts, build OK
- [x] S6 : vérification dans la vraie app (CDP), mesures, `.jsonl` inchangés

Détails dans `tasks/todo.md`.

## Risques
| Risque | Impact | Parade |
|---|---|---|
| 1re recherche > 2 s sur 67 Mo | Moyen | Mesure en S6 ; si trop lent, lectures en parallèle par lots |
| Mémoire : texte de 104 sessions gardé | Faible | Seulement le texte des messages (bien moins que 67 Mo) |
| Index de message décalé → mauvais défilement | Moyen | Même `parseSession` pour la relecture et la recherche ; test dédié |
| Défilement auto vers le bas de `ChatView` écrase le défilement voulu | Moyen | `ChatView` ne descend en bas que sans `focusIndex` |

## Questions ouvertes
Aucune.
