# Todo : module model

## T1 : choisir le modèle au lancement
- [x] `src/shared/model.ts` : type `ModelChoice = 'opus' | 'sonnet' | 'haiku'` et `MODEL_CHOICES` (avec libellés)
- [x] `buildClaudeArgs({ sessionId, resume, model })` ajoute `--model X` seulement si `model` est défini
- [x] `SessionManager.start(cwd, resumeId?, model?)` ; IPC `start` et preload transmettent `opts.model`
- Vérif : `npm test` (claude-args : avec/sans modèle × resume/session-id ; session-manager : les args du faux CLI contiennent `--model`), typecheck
- Fichiers : `src/shared/model.ts`, `src/main/claude-args.ts`, `src/main/session-manager.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`

## T2 : afficher le modèle réellement utilisé
- [x] `BridgeEvent` gagne `{ type: 'model'; sessionId; model }` ; le parseur l'émet à la réception de `system/init`
- [x] reducer : `activeModel` dans `SessionState` ; l'en-tête du chat l'affiche (ex. « claude-opus-5-5 »)
- Vérif : `npm test` (stream-parser sur `stream-bonjour.jsonl` → `claude-opus-5-5` ; sessions : l'action stocke activeModel ; rendu de l'en-tête), typecheck, lint
- Fichiers : `src/shared/events.ts`, `src/main/stream-parser.ts`, `src/renderer/src/state/sessions.ts`, `src/renderer/src/components/chat-view.tsx`

## Checkpoint A (après T1-T2)
- [x] test, typecheck, lint, build OK

## T3 : relancer une session avec un autre modèle (main)
- [x] Le main retient le `cwd` de chaque session ; `restart(sessionId, model)` = stop + start(cwd, sessionId, model)
- [x] Les écouteurs `exit`/`error`/`stdout` ignorent un processus qui n'est plus celui de la session
- [x] IPC `session:set-model` + preload `setModel(sessionId, model): Promise<void>`
- Vérif : `npm test` (faux CLI : restart relance avec `--resume id --model sonnet`, aucun événement `error` émis, `has(id)` reste vrai après la fin de l'ancien processus)
- Fichiers : `src/main/session-manager.ts`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`, `tests/session-manager.test.ts`

## T4 : liste déroulante et dernier choix
- [x] `readLastModel(storage)` / `writeLastModel(storage, m)` : valeur inconnue ou illisible → Par défaut
- [x] `model-picker.tsx` dans l'en-tête : 4 choix, grisé pendant un tour ; un changement appelle `setModel` puis met à jour `model` dans l'état et le dernier choix
- [x] Nouvelle session → `startSession(cwd, { model: dernier choix })`
- Vérif : `npm test` (lecture/écriture du dernier choix ; rendu du picker : 4 options, `disabled` pendant un tour), typecheck, lint
- Fichiers : `src/renderer/src/model-choice.ts`, `src/renderer/src/components/model-picker.tsx`, `chat-view.tsx`, `state/sessions.ts`, `app.tsx`

## T5 : la passation garde le modèle
- [x] La session neuve de la passation est lancée avec le `model` de la session résumée
- Vérif : `npm test` si la logique est extraite, sinon vérification en T6
- Fichiers : `src/renderer/src/app.tsx`

## Checkpoint final T6 (vraie app, CDP)
- [ ] Sonnet sur une session → l'en-tête affiche `claude-sonnet-…`, le fil est conservé et le CLI se souvient du message d'avant
- [ ] Liste grisée pendant une réponse
- [ ] Redémarrage de l'app → la nouvelle session part sur Sonnet
- [ ] Passation depuis Haiku → session neuve en Haiku
- [ ] « Par défaut » → pas de `--model` dans la commande lancée
- [ ] test, typecheck, lint, build OK ; mettre `model` ✅ dans `SPEC.md`
