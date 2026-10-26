# Tâches : module search

## S1 : fonctions pures de recherche
Fichiers : `src/shared/search.ts`, `src/renderer/src/ui-format.ts` (import de `fold`), `tests/search.test.ts`.
- [ ] `fold`, `searchTerms(query)` (mots pliés, rien si < 3 caractères au total), `searchableTexts(items)` (`{ index, text }` des items user/assistant), `matchSession(texts, terms)` (`{ count, first }` ou null si un mot manque dans la session), `snippet(text, term)` (~120 caractères, `before / match / after`), type `SearchHit`, `validQuery(q)`.
- [ ] Tests : accents/casse, plusieurs mots (tous requis, messages différents OK), < 3 caractères, outils ignorés, extrait en début/fin, requête invalide (non-chaîne, > 200).
- Vérif : `npm test`, typecheck.

## S2 : index de recherche côté main
Fichiers : `src/main/search-index.ts`, `tests/search-index.test.ts`.
- [ ] `createSearchIndex(root, read = readFile)` → `search(query)` : parcourt les `.jsonl`, cache `{ size, mtimeMs, texts, title, cwd, lastAt }`, ignore les fichiers illisibles, 50 résultats max triés du plus récent au plus ancien.
- [ ] Tests (dossier temporaire) : 2e recherche sans relecture (compteur), fichier modifié relu, fichier illisible sauté, contenus et dates inchangés.
- Vérif : `npm test`.

## S3 : IPC
Fichiers : `src/shared/api.ts`, `src/main/ipc.ts`, `src/preload/index.ts`.
- [ ] `searchHistory(query): Promise<SearchHit[]>`, requête refusée côté main si `!validQuery`.
- Vérif : typecheck, lint, tests.

## Checkpoint A
- [ ] Tests, typecheck, lint verts.

## S4 : section « Dans les conversations »
Fichiers : `src/renderer/src/components/search-results.tsx`, `history-list.tsx`, `styles.css`, `tests/search-results.test.tsx`.
- [ ] Section affichée dès 3 caractères après 300 ms ; « Recherche… » pendant l'attente ; « Rien trouvé dans les conversations » ; réponses en retard ignorées.
- [ ] Ligne : titre (nom perso), projet, nombre trouvé, extrait avec `<mark>`.
- [ ] Tests `renderToStaticMarkup` : cachée sous 3 caractères, `<mark>`, message vide.

## S5 : ouverture au bon message
Fichiers : `app.tsx`, `history-view.tsx`, `chat-view.tsx`, `styles.css`, tests existants.
- [ ] `onOpen(folder, id, focusIndex?)` ; `ChatView` défile jusqu'à l'élément `focusIndex` et le surligne (classe `msg-found`, quelques secondes), sinon en bas comme avant.
- [ ] Test : l'élément trouvé porte la classe de surlignage.

## Checkpoint B
- [ ] Tests, typecheck, lint, build verts.

## S6 : vraie app
- [ ] Mot présent seulement dans le contenu d'une vieille session → trouvé, clic → message surligné.
- [ ] « electron » trouve « Électron » ; deux mots → les deux requis.
- [ ] Mesures : 1re recherche < 2 s, suivantes < 200 ms.
- [ ] Empreinte (taille + mtime) des `.jsonl` identique avant/après.
- [ ] Cocher search dans `SPEC.md`.
