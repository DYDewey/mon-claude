# Plan : module history

Spec : `SPEC-history.md`. Plan précédent : `tasks/archive/usage-plan.md`.

## Décisions
- Le main convertit les `.jsonl` en `ChatItem` (même format que le chat) : le renderer ne voit jamais le JSON brut, et on réutilise l'affichage existant.
- `ChatItem` passe de `renderer/state/sessions.ts` à `shared/chat-item.ts` (réexporté depuis `sessions.ts`) pour que le main puisse s'en servir.
- Conversion pure (`history-parser.ts`, sans fichiers) séparée de la lecture disque (`history-reader.ts`) : on teste la conversion sans toucher au disque.
- Lecture seule garantie par construction : seulement `readdir`, `stat`, `createReadStream` et `readFile`. Le chemin demandé est vérifié (il doit rester sous `~/.claude/projects/`).
- L'historique affiché n'entre pas dans le reducer des sessions en cours : un état à part dans `app.tsx`. Sélectionner une session en cours ferme la vue historique, et inversement.
- `ChatView` prend `items` + `running` au lieu d'une `SessionState`, pour servir aux deux vues.

## Graphe
```
H1 parser ─→ H2 reader ─→ H3 IPC ─→ H4 liste (sidebar) ─→ H5 vue lecture seule ─→ H6 checkpoint vraie app
```

## Tâches

### H1 — Conversion d'une session `.jsonl`
`src/main/history-parser.ts` + `src/shared/chat-item.ts`.
- `parseSession(lines: string[]) → { title, cwd?, lastAt?, messageCount, items: ChatItem[] }`.
- Titre : dernier `custom-title` > dernier `ai-title` > 1er message `user` texte (tronqué à 60 caractères) > « Sans titre ».
- `user` texte (chaîne ou bloc `text`) → `{kind:'user'}` ; `assistant` `text` → `{kind:'assistant'}`, `tool_use` → `{kind:'tool'}` ; le reste est ignoré, ainsi que les lignes JSON cassées.
- **Critères** : tests Vitest sur une fixture `tests/fixtures/history/sample.jsonl` (lignes réelles anonymisées + 1 ligne cassée + 1 type inconnu) ; les 3 cas de titre.
- **Vérif** : `npm test`, `npm run typecheck`.

### H2 — Lecture du disque
`src/main/history-reader.ts`.
- `listProjects(root) → Project[]` (`{ folder, path, sessions: SessionMeta[] }`, triés par activité récente). Lecture ligne par ligne, cache par fichier tant que `mtime` est inchangé. Les sous-dossiers sont ignorés.
- `readSession(root, folder, id) → ChatItem[]`, qui refuse un `folder`/`id` contenant `..`, `/`, `\` ou sortant de `root`.
- **Critères** : tests sur un dossier temporaire (2 projets, 3 sessions, 1 sous-dossier `memory/`) ; tri ; cache ; refus de `..\..\x` ; `mtime` des fichiers identique après lecture.
- **Vérif** : `npm test`.

### H3 — IPC
`src/shared/api.ts`, `src/main/ipc.ts`, `src/preload/index.ts`.
- `window.claude.listHistory(): Promise<Project[]>` et `readHistory(folder, id): Promise<ChatItem[]>` ; racine = `os.homedir()/.claude/projects`. Arguments vérifiés côté main.
- **Critères** : typecheck OK ; test du handler (arguments invalides refusés) si c'est simple, sinon vérifié en H6.
- **Vérif** : `npm run typecheck`, `npm run build`.

### H4 — Liste dans la barre latérale
`src/renderer/src/components/history-list.tsx`, `src/renderer/src/history-format.ts`.
- Section « Historique » sous les sessions en cours, avec un bouton ↻. Projets repliables (fermés par défaut) avec leur nombre de sessions. Sessions avec titre + « il y a 2 j ».
- `relativeDate(ms, now)` et `projectLabel(project)` (dernier dossier de `path`, sinon `folder`) sont des fonctions pures testées.
- **Critères** : tests des fonctions pures + rendu du composant (clic sur un projet = dépliage, clic sur une session = `onOpen(folder, id)`).
- **Vérif** : `npm test`, `npm run lint`.

### H5 — Vue lecture seule
`app.tsx`, `chat-view.tsx`.
- `ChatView({ items, running })`. Clic sur une session de l'historique → `readHistory` → affichage avec l'en-tête « titre · chemin » et un bandeau « 📖 Lecture seule », sans Composer. Pendant le chargement : « Chargement… » ; en cas d'erreur : ligne d'erreur.
- **Critères** : tests existants du chat toujours verts ; test de rendu : bandeau présent, pas de zone de saisie.
- **Vérif** : `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

### H6 — Checkpoint dans la vraie app (via CDP, `--user-data-dir` séparé)
- Les 15 projets apparaissent ; une session de mon-claude s'ouvre et s'affiche correctement.
- Le fichier de 4,9 Mo (`Block-reels-insta/42a4e599…`) s'ouvre en moins de 2 s.
- `mtime` de tous les `.jsonl` identiques avant/après (script de comparaison dans le scratchpad).
- Passer d'une session en cours à l'historique puis revenir fonctionne.
