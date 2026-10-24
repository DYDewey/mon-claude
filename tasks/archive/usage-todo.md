# Todo : module usage

Vérif de chaque tâche : `npm test`, `npm run typecheck`, `npm run lint` verts. Un commit par tâche (sans Co-Authored-By).

- [x] **U1 : parser** (S) : `rate_limit_event` → `rate-limits` ; `result` → `context` (used, max) ; `prompt_suggestion` → `suggestion`.
  - Fichiers : `src/shared/events.ts`, `src/main/stream-parser.ts`, `tests/stream-parser.test.ts`
- [x] **U2 : activer les suggestions** (XS) : `--prompt-suggestions true` + env `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=1`.
  - Fichiers : `src/main/claude-args.ts`, `src/main/session-manager.ts`, `tests/claude-args.test.ts`
- [x] **U3 : reducer** (S) : `limits` global ; `context` et `suggestion` par session ; `user-sent` efface la suggestion ; pas de « non lu » pour ces événements.
  - Fichiers : `src/renderer/src/state/sessions.ts`, `tests/sessions.test.ts`
- [x] **U4 : jauges + contexte** (M) : `usage-format.ts` (testé), composant `UsageGauges` en bas de la barre latérale, % de contexte (barre latérale + en-tête), cache localStorage.
  - Fichiers : `src/renderer/src/usage-format.ts`, `components/usage-gauges.tsx`, `sidebar.tsx`, `app.tsx`, `styles.css`, `tests/usage-format.test.ts`
- [x] **U5 : suggestion** (S) : texte gris dans la saisie vide, Tab la recopie.
  - Fichiers : `components/composer.tsx`, `app.tsx`, `styles.css`

### Checkpoint
- [x] Vérifié dans la vraie app (CDP) : jauges + contexte 3 %, suggestion au 2e tour + Tab, jauges grisées « à l'instant » au redémarrage.
- Note : pas de suggestion au 1er tour (le CLI exige ≥ 2 messages assistant), parfois aucune si Claude n'a rien à proposer.
- Note : pour tester un redémarrage alors qu'une autre instance est ouverte, lancer avec `--user-data-dir` séparé (l'autre verrouille le localStorage).
