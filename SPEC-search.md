# Spec : module search

Validée le 26/10/2026. Index : `SPEC.md`.

## Objectif
Retrouver une ancienne conversation par **ce qui s'y est dit**, pas seulement par son titre. Ex. : je tape « useEffect cleanup » et je retrouve la session où Claude me l'a expliqué il y a 3 semaines. Lecture seule : les `.jsonl` ne sont jamais modifiés.

## Fonctionnement
1. **Même champ que la recherche actuelle** de la barre latérale. Le filtre sur les titres reste instantané ; en plus, dès 3 caractères et après 300 ms sans frappe, une section **« Dans les conversations »** apparaît sous l'historique filtré.
2. **Correspondance** : insensible à la casse et aux accents (même `fold` que `filterHistory`). Plusieurs mots → tous doivent apparaître dans la session (pas forcément dans le même message). Pas d'expressions régulières.
3. **Ce qui est cherché** : le texte de mes messages et des réponses de Claude. Pas les sorties d'outils, pas les blocs de réflexion, pas les pièces jointes (trop de bruit).
4. **Résultats** : au plus 50 sessions, de la plus récente à la plus ancienne. Chaque ligne : titre (nom personnalisé s'il existe), nom du projet en petit, nombre de messages trouvés, et un **extrait** d'environ 120 caractères autour du premier mot trouvé, mot surligné (`<mark>`).
5. **Clic** sur un résultat : ouvre la session en relecture (comme l'historique) et fait défiler jusqu'au premier message trouvé, surligné quelques secondes.
6. **Rapidité** : main garde en mémoire le texte extrait de chaque `.jsonl`, relu seulement si sa taille ou sa date de modification a changé. Une nouvelle frappe annule la recherche en cours (la réponse en retard est ignorée). Pendant la première recherche : « Recherche… ».
7. **Robustesse** : un `.jsonl` illisible est sauté sans bloquer les autres. Aucun résultat → « Rien trouvé dans les conversations ».

## Hors périmètre
- Recherche dans les sessions **en cours** (elles sont dans l'historique dès qu'on le rafraîchit).
- Index sur disque, recherche floue / fautes de frappe, opérateurs (`OU`, `"phrase exacte"`), filtres par date ou projet.
- Raccourci Ctrl+K : viendra avec `shortcuts`.

## Découpage
- `src/shared/search.ts` : fonctions pures `searchTerms(query)` (découpe + `fold`, ≥ 3 caractères au total), `extractTexts(lines)` (textes cherchables d'un `.jsonl`, avec index du message), `matchSession(texts, terms)` (nombre de messages trouvés, index du premier), `snippet(text, term)` (extrait + position du surlignage).
- `src/main/search-index.ts` : cache `fichier → { size, mtimeMs, texts }`, lecture seule (`stat`, `readFile`), réutilise la sécurité des chemins de `history-reader`.
- `src/main/ipc.ts` + `src/preload/index.ts` + `src/shared/api.ts` : `searchHistory(query): Promise<SearchHit[]>`, la requête est vérifiée côté main (chaîne, ≤ 200 caractères).
- Renderer : nouvelle `search-results.tsx`, `app.tsx` (attente de 300 ms, ignorer les réponses en retard, ouverture + défilement), `history-view.tsx` (prop `focusIndex` : défiler jusqu'au message et le surligner).

## Tests
- Vitest, fonctions pures dans `tests/search.test.ts` : accents/casse, plusieurs mots, < 3 caractères → rien, sorties d'outils ignorées, extrait en début/fin de texte, ligne JSON cassée ignorée.
- `search-index` sur un dossier temporaire : 2e recherche sans relire le fichier (compteur de lectures), fichier modifié → relu, fichier illisible → sauté, aucune écriture.
- Composants (`renderToStaticMarkup`) : section cachée sous 3 caractères, extrait avec `<mark>`, message « Rien trouvé ».
- Vraie app (CDP) : chercher un mot présent seulement dans le contenu d'une vieille session, cliquer, le message s'affiche surligné. Mesurer la 1re recherche et la suivante.

## Limites
- Toujours : tests avant chaque commit, un commit par tâche, lecture seule de `~/.claude/projects/`.
- Demander d'abord : toute nouvelle dépendance (pas de moteur de recherche externe), tout fichier écrit sur disque.
- Jamais : modifier ou supprimer un `.jsonl`, appel payant.

## Critères de réussite
- Un mot présent seulement dans le contenu d'une conversation la fait apparaître dans « Dans les conversations ».
- « electron » trouve aussi « Électron » ; « react hooks » ne trouve que les sessions qui contiennent les deux mots.
- Sur mon historique (67 Mo, 104 sessions) : 1re recherche < 2 s, les suivantes < 200 ms.
- Le clic ouvre la session au bon message.
- Les `.jsonl` ont le même contenu et la même date de modification avant et après.
- Les tests existants restent verts.

## Décisions (26/10/2026)
1. Sorties d'outils : **non cherchées**.
2. Défilement jusqu'au message trouvé : **inclus**.
