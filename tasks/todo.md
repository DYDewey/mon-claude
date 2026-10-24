# Todo : module chat

Vérif standard de chaque tâche : `npm test`, `npm run typecheck`, `npm run lint` verts. Un commit par tâche (sans Co-Authored-By).

## Phase 1 : pont étendu

- [x] **T1 : `interrupt(sessionId)`** (M)
  - Vérifier sur le vrai CLI : écrire `{"type":"control_request","request_id":"…","request":{"subtype":"interrupt"}}` sur stdin pendant une réponse. On regarde si un `result` arrive et si le message suivant marche.
  - ✅ Vérifié : `control_response` success puis `result` `error_during_execution` (erreur masquée), le message suivant marche et Claude se souvient.
  - Critères : test Vitest (faux CLI) → après interrupt, la session accepte un nouveau message ; API `interrupt` exposée (shared/api, ipc, preload).
  - Fichiers : `src/main/session-manager.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`, `tests/session-manager.test.ts`, `tests/fixtures/fake-claude.cjs`

- [ ] **T2 : événement `tool-use`** (XS)
  - Critères : un message `assistant` avec bloc `tool_use` donne `{ type:'tool-use', sessionId, name, input }` ; les autres messages ne changent pas.
  - Fichiers : `src/shared/events.ts`, `src/main/stream-parser.ts`, `tests/stream-parser.test.ts`

- [ ] **T3 : `pickFolder()`** (S)
  - Critères : `dialog.showOpenDialog` (openDirectory) côté main ; renvoie le chemin ou `null` si annulé ; exposé via preload.
  - Fichiers : `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`
  - Vérif manuelle : appel depuis la console DevTools.

### Checkpoint 1
- [ ] Tous les tests verts, `npm run build` OK, revue avec toi.

## Phase 2 : première tranche

- [ ] **T4 : reducer `state/sessions.ts`** (S)
  - Critères (tests) : `text-delta` s'ajoute au bon message de la bonne session ; `turn-end` termine le tour ; un événement sur une session non active la marque « non lue » ; `tool-use` ajoute une ligne d'outil.
  - Fichiers : `src/renderer/src/state/sessions.ts`, `tests/sessions.test.ts`

- [ ] **T5 : une session de bout en bout** (M)
  - Bouton « + » → `pickFolder` → `startSession` ; zone de saisie (Entrée envoie, Maj+Entrée saut de ligne, bloquée pendant une réponse) ; texte brut en direct ; « Claude démarre… ».
  - Fichiers : `app.tsx`, `components/chat-view.tsx`, `components/composer.tsx`
  - Vérif manuelle : j'envoie un message et la réponse s'affiche en direct.

### Checkpoint 2
- [ ] Démo en vrai, revue avec toi.

## Phase 3 : complet

- [ ] **T6 : barre latérale multi-sessions** (M)
  - Titre = début du 1er message ; indicateurs ● en cours / ◌ non lu ; changer de session ; fermer = `stopSession`.
  - Fichiers : `components/sidebar.tsx`, `app.tsx`, `state/sessions.ts` (+ tests)
  - Vérif manuelle : 2 sessions dans 2 dossiers, réponses en parallèle.

- [ ] **T7 : Markdown + coloration** (S)
  - Ajouter `react-markdown`, `remark-gfm`, `rehype-highlight` ; pas de HTML brut.
  - Fichiers : `components/message.tsx`, `package.json`, styles
  - Vérif manuelle : bloc de code coloré, liste en liste ; `npm run build` OK.

- [ ] **T8 : lignes d'outils** (S)
  - Icône + nom + cible principale (`file_path`, `command`, `pattern`…), dépliable pour voir `input`.
  - Fichiers : `components/tool-line.tsx`, `components/chat-view.tsx`

- [ ] **T9 : Stop + erreurs** (S)
  - Le bouton Envoyer devient Stop pendant une réponse → `interrupt` ; un événement `error` s'affiche dans la conversation.
  - Fichiers : `components/composer.tsx`, `components/chat-view.tsx`, `state/sessions.ts`
  - Vérif manuelle : Stop, puis nouveau message → Claude se souvient du début.

### Checkpoint final
- [ ] Tous les critères de `SPEC-chat.md` remplis, dont une skill perso (`/aide-decision`) qui marche dans l'app.
