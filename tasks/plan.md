# Plan : module handoff

Spec : `SPEC-handoff.md`. Plan précédent : `tasks/archive/history-plan.md`.

## Décisions
- Logique pure dans `src/shared/handoff.ts` (prompt, extraction du résumé, nom de fichier) : testée sans Electron ni React.
- Extraction : `handoffResult(items, fromIndex)` lit seulement les éléments **après** la consigne. On ne récupère donc jamais un vieux message si le tour échoue. Elle renvoie `null` s'il y a une `error` ou un `stopped`, ou si le texte est vide.
- L'état « passation » vit dans `app.tsx` (comme `viewing` pour history), hors reducer : `{ sessionId, fromIndex, phase: 'writing' } | { sessionId, phase: 'review', text }`. On le déclenche quand la session repasse de `running` à `idle`.
- Écriture disque seulement dans `userData/handoffs` ; l'`id` court est vérifié (`[A-Za-z0-9-]`), pour éviter `..` ou `/`.
- Nouvelle session : on réutilise le chemin existant (`startSession(cwd)` puis `sendMessage`), sans nouveau canal pour lancer.

## Graphe
```
P1 logique pure ─┬─→ P3 bouton + rédaction ─→ P4 fenêtre d'édition + session neuve ─→ P5 checkpoint vraie app
P2 stockage + IPC ┘
```

## Tâches

### P1 — Logique pure
`src/shared/handoff.ts`.
- `buildHandoffPrompt(): string` : consigne + modèle garde-contexte (8 sections, 40 lignes max, « n'invente rien, écris inconnu », réponds uniquement avec le Markdown).
- `handoffResult(items, fromIndex): string | null` : concatène les `assistant` après `fromIndex`, ignore les `tool`, et renvoie `null` s'il y a une `error` ou un `stopped`, ou si le résultat est vide après `trim`.
- `handoffFileName(date, sessionId): string` → `AAAA-MM-JJ_HHhMM_<6 car.>.md` (heure locale).
- **Critères** : tests Vitest (le prompt contient chaque section ; résultat normal, avec outils, erreur, stopped, vide, ancien message avant `fromIndex` ignoré ; nom de fichier avec date fixe).
- **Vérif** : `npm test`, `npm run typecheck`.

### P2 — Stockage + IPC
`src/main/handoff-store.ts`, `src/main/ipc.ts`, `src/shared/api.ts`, `src/preload/index.ts`.
- `saveHandoff(dir, text, sessionId, now)` : crée `dir` si besoin, écrit le fichier en UTF-8 et renvoie son chemin. Refuse un `sessionId` invalide et un texte vide.
- `window.claude.saveHandoff(text, sessionId): Promise<string>`, canal `handoff:save`, `dir = app.getPath('userData')/handoffs`, arguments vérifiés côté main.
- **Critères** : tests sur un dossier temporaire (dossier créé, contenu identique, refus de `../x` et du texte vide).
- **Vérif** : `npm test`, `npm run typecheck`, `npm run build`.

### P3 — Bouton « Passation » et rédaction
`app.tsx`, `chat-view.tsx` ou l'en-tête existant.
- Bouton dans l'en-tête de la session active, désactivé si `running` ou s'il n'y a aucun message. Au clic : on mémorise `fromIndex = items.length`, puis on envoie `buildHandoffPrompt()` comme un message normal. Indication « ✍️ Passation en cours… ».
- Au passage `running → idle` : `handoffResult` → phase `review`, ou ligne d'erreur « Passation impossible » si le résultat est `null`.
- **Critères** : test de rendu : bouton désactivé pendant une réponse, actif sinon ; test de la transition si elle est extraite en fonction pure.
- **Vérif** : `npm test`, `npm run lint`.

### P4 — Fenêtre d'édition et session neuve
`src/renderer/src/components/handoff-dialog.tsx`, `app.tsx`, `styles.css`.
- Fenêtre avec une textarea pré-remplie et les boutons « Annuler » et « Ouvrir une session neuve » (désactivé si le texte est vide).
- Valider : `saveHandoff` → `startSession(même cwd)` → `session-opened` → `sendMessage(texte)` + `user-sent` ; la nouvelle session devient active ; l'ancienne reste ouverte. Si l'enregistrement échoue, la fenêtre reste ouverte avec un message d'erreur.
- **Critères** : test de rendu : édition, Annuler → `onCancel`, validation → `onConfirm(texte modifié)`, bouton désactivé si le texte est vide.
- **Vérif** : `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

### P5 — Checkpoint dans la vraie app (CDP, `--user-data-dir` séparé)
- Session courte dans le dossier du projet → Passation → le résumé s'affiche en direct → la fenêtre s'ouvre.
- Je modifie le texte puis je valide → le `.md` dans `<userdata>/handoffs/` est identique au texte relu.
- Le `.jsonl` de la nouvelle session ne contient qu'un seul message `user` (non méta) : le résumé.
- « Annuler » ne crée ni fichier ni session.
- Utilise l'abonnement (2 ou 3 messages courts), c'est sans coût supplémentaire.
