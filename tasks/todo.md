# Tâches : module search

## S1 : fonctions pures de recherche
Fichiers : `src/shared/search.ts`, `src/renderer/src/ui-format.ts` (import de `fold`), `tests/search.test.ts`.
- [x] `fold`, `searchTerms(query)` (mots pliés, rien si < 3 caractères au total), `searchableTexts(items)` (`{ index, text }` des items user/assistant), `matchSession(texts, terms)` (`{ count, first }` ou null si un mot manque dans la session), `snippet(text, term)` (~120 caractères, `before / match / after`), type `SearchHit`, `validQuery(q)`.
- [x] Tests : accents/casse, plusieurs mots (tous requis, messages différents OK), < 3 caractères, outils ignorés, extrait en début/fin, requête invalide (non-chaîne, > 200).
- Vérif : `npm test`, typecheck.

## S2 : index de recherche côté main
Fichiers : `src/main/search-index.ts`, `tests/search-index.test.ts`.
- [x] `createSearchIndex(root, read = readFile)` → `search(query)` : parcourt les `.jsonl`, cache `{ size, mtimeMs, texts, title, cwd, lastAt }`, ignore les fichiers illisibles, 50 résultats max triés du plus récent au plus ancien.
- [x] Tests (dossier temporaire) : 2e recherche sans relecture (compteur), fichier modifié relu, fichier illisible sauté, contenus et dates inchangés.
- Vérif : `npm test`.

## S3 : IPC
Fichiers : `src/shared/api.ts`, `src/main/ipc.ts`, `src/preload/index.ts`.
- [x] `searchHistory(query): Promise<SearchHit[]>`, requête refusée côté main si `!validQuery`.
- Vérif : typecheck, lint, tests.

## Checkpoint A
- [x] Tests, typecheck, lint verts.

## S4 : section « Dans les conversations »
Fichiers : `src/renderer/src/components/search-results.tsx`, `history-list.tsx`, `styles.css`, `tests/search-results.test.tsx`.
- [x] Section affichée dès 3 caractères après 300 ms ; « Recherche… » pendant l'attente ; « Rien trouvé dans les conversations » ; réponses en retard ignorées.
- [x] Ligne : titre (nom perso), projet, nombre trouvé, extrait avec `<mark>`.
- [x] Tests `renderToStaticMarkup` : cachée sous 3 caractères, `<mark>`, message vide.

## S5 : ouverture au bon message
Fichiers : `app.tsx`, `history-view.tsx`, `chat-view.tsx`, `styles.css`, tests existants.
- [x] `onOpen(folder, id, focusIndex?)` ; `ChatView` défile jusqu'à l'élément `focusIndex` et le surligne (classe `msg-found`, quelques secondes), sinon en bas comme avant.
- [x] Test : l'élément trouvé porte la classe de surlignage.

## Checkpoint B
- [x] Tests, typecheck, lint, build verts.

## S6 : vraie app
- [x] Mot présent seulement dans le contenu d'une vieille session → trouvé, clic → message surligné.
- [x] « electron » trouve « Électron » ; deux mots → les deux requis.
- [x] Mesures : 1re recherche < 2 s, suivantes < 200 ms.
- [x] Empreinte (taille + mtime) des `.jsonl` identique avant/après.
- [x] Cocher search dans `SPEC.md`.

## Résultats S6 (26/10/2026, vraie app, 105 sessions, 68 Mo)
- 1re recherche 1,24 s, suivante 25 ms.
- « electron » et « Électron » : 8 sessions chacun ; les sessions où le mot n'apparaît que dans les rappels système (`api-request-blob`) sont exclues, comme prévu.
- « mutation » : clic sur une session ancienne → message trouvé visible et surligné (un seul), défilé au milieu.
- Empreinte des `.jsonl` identique, sauf la session Claude Code en cours (écrite par Claude Code lui-même).
- Corrigé en S6 : un « Rien trouvé » de la requête précédente ne reste plus affiché pendant la frappe.
