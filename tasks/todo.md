# Tâches : module cli-bridge

## T1 : capturer un vrai flux stream-json
**Description :** lancer une fois `claude` en mode stream-json (entrée et sortie), envoyer « bonjour », enregistrer la sortie comme fixture de test.
**Critères :**
- [x] `tests/fixtures/stream-bonjour.jsonl` existe et contient un vrai flux
- [x] Le format du message d'entrée sur stdin est confirmé
- [x] On sait où se trouve le `session_id` (sur toutes les lignes)
**Vérif :** lecture de la fixture ; noter les types de lignes rencontrés dans `plan.md`.
**Dépend de :** rien
**Fichiers :** `tests/fixtures/stream-bonjour.jsonl`

## T2 : squelette electron-vite + React + Vitest
**Description :** créer le projet (Electron + TS strict + React + Vitest + ESLint), structure `src/main`, `src/preload`, `src/renderer`, `src/shared`.
**Critères :**
- [x] `npm run dev` ouvre une fenêtre avec un titre « Mon-Claude »
- [x] `npm test` passe (un test trivial)
- [x] `npm run typecheck` et `npm run build` passent
**Vérif :** les 4 commandes ci-dessus + fenêtre vue à l'écran.
**Dépend de :** rien
**Fichiers :** `package.json`, configs, `src/*/index.ts(x)`

## Checkpoint A
- [x] Fixture réelle disponible, projet qui démarre, tests verts
- [x] Validation avant de continuer

## T3 : parser de flux → BridgeEvent
**Description :** fonction pure qui reçoit des morceaux de texte de stdout, recolle les lignes, parse le JSON et renvoie des `BridgeEvent`.
**Critères :**
- [x] La fixture donne une suite de `text-delta` puis un `turn-end`
- [x] Une ligne coupée en deux morceaux est bien recollée
- [x] Ligne invalide ou type inconnu : ignorée, pas de plantage
**Vérif :** `npm test`
**Dépend de :** T1, T2
**Fichiers :** `src/shared/events.ts`, `src/main/stream-parser.ts`, `tests/stream-parser.test.ts`

## T4 : démarrer / envoyer / arrêter une session
**Description :** gestionnaire de sessions côté main : construit les arguments, lance `claude.exe`, écrit sur stdin, branche le parser, émet `error` si le lancement échoue, tue les processus à la fermeture.
**Critères :**
- [x] Arguments construits correctement, avec et sans `--resume` (test)
- [x] `claude` introuvable → événement `error` lisible (test avec un faux exécutable)
- [x] Fermer l'app ne laisse aucun processus `claude`
**Vérif :** `npm test` + Gestionnaire des tâches après fermeture.
**Dépend de :** T3
**Fichiers :** `src/main/claude-args.ts`, `src/main/session-manager.ts`, `src/main/index.ts`, `tests/claude-args.test.ts`

## T5 : exposer l'API au renderer
**Description :** IPC main ↔ preload, `window.claude.startSession / sendMessage / stopSession / onEvent`.
**Critères :**
- [x] Depuis la console DevTools, un « bonjour » affiche les morceaux de réponse au fil de l'eau
- [x] Le renderer n'a aucun accès direct à Node (`contextIsolation` actif)
**Vérif :** test manuel en console + `npm run typecheck`
**Dépend de :** T4
**Fichiers :** `src/preload/index.ts`, `src/main/ipc.ts`, `src/renderer/env.d.ts`

## Checkpoint B : module cli-bridge terminé
- [x] Tous les critères de `SPEC-cli-bridge.md` cochés
- [x] Tests, typecheck, build verts
- [x] Validation avant le module `chat`
