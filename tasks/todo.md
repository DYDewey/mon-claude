# Todo : module organize

## O1 : fonctions pures
- [x] `src/shared/organize.ts` : `OrganizeData { version: 1; sessions: Record<string, SessionMeta> }`, `SessionMeta { favorite?: true; title?: string }`, `sessionKey(folder, id)`, `emptyOrganize()`
- [x] `toggleFavorite`, `renameSession` (nom vide ou espaces = champ retiré ; entrée vide = clé retirée), `displayTitle(session, meta)`, `favoriteSessions(projects, data)` (liste plate, plus récente d'abord, favoris dont le `.jsonl` a disparu ignorés), `parseOrganize(text)` (JSON invalide, version inconnue, champs en trop → nettoyé ou vide)
- Vérif : `npm test` (nouveau `tests/organize.test.ts`), typecheck, lint
- Fichiers : `src/shared/organize.ts`, `tests/organize.test.ts`

## O2 : stockage + IPC
- [x] `src/main/organize-store.ts` : `loadOrganize(dir)` (absent → vide ; illisible → vide et note « à sauvegarder en .bak »), `saveOrganize(dir, data)` (`.bak` si besoin, `.tmp` puis `rename`)
- [x] IPC `organize:get` / `organize:set` (donnée repassée dans `parseOrganize`), preload, `ClaudeApi.getOrganize/setOrganize`
- [ ] `app.tsx` : état `organize` chargé au démarrage (fait avec O3, pour que chaque commit reste vert)
- Vérif : `npm test` (nouveau `tests/organize-store.test.ts` sur un dossier temporaire : aller-retour, fichier corrompu → vide + `.bak`, pas de `.tmp` restant), typecheck, lint
- Fichiers : `src/main/organize-store.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`, `src/renderer/src/app.tsx`, test

## O3 : étoile + section Favoris
- [ ] `history-list.tsx` : bouton étoile (`Star`, `aria-label` « Ajouter aux favoris » / « Retirer des favoris », `aria-pressed`), visible au survol, plein et orange si favori ; `stopPropagation`
- [ ] Nouvelle `favorites-list.tsx` : section « Favoris » entre « En cours » et « Historique », nom du projet en petit, clic = ouvrir en lecture ; cachée si vide
- [ ] `app.tsx` : `toggleFavorite` + `setOrganize`
- Vérif : `npm test` (étoile pleine pour un favori, section cachée si vide, ordre), typecheck, lint
- Fichiers : `history-list.tsx`, `favorites-list.tsx`, `app.tsx`, `styles.css`, tests

## O4 : renommage + recherche
- [ ] `renameKey(key)` pure ; crayon (`Pencil`) au survol → champ de saisie, Entrée valide, Échap annule, perte du focus valide
- [ ] `displayTitle` utilisé dans l'historique et les favoris ; `filterHistory` cherche dans le titre affiché
- Vérif : `npm test` (`renameKey`, titre personnalisé affiché, « promesses js » trouve « Promesses JS »), typecheck, lint, `npm run build`, essai rapide en `npm run dev`
- Fichiers : `history-list.tsx`, `favorites-list.tsx`, `ui-format.ts`, `app.tsx`, tests

## O5 : en-tête de la relecture
- [ ] `history-view.tsx` : étoile et crayon dans l'en-tête, titre affiché = nom personnalisé
- Vérif : `npm test` (rendu de l'en-tête avec favori et nom personnalisé), typecheck, lint
- Fichiers : `history-view.tsx`, `app.tsx`, test

## O6 : vérification dans la vraie app
- [ ] `npm run dist` + installation ; via CDP : mettre en favori, renommer, rechercher, redémarrer, tout est encore là ; aucune erreur dans la console
- [ ] Empreintes (taille + date) des `.jsonl` de `~/.claude/projects/` identiques avant et après
- [ ] `SPEC.md` : `organize` ✅ ; archiver `tasks/plan.md` et `tasks/todo.md` en `tasks/archive/organize-*.md`
