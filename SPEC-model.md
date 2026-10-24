# Spec : module model

Brouillon du 24/10/2026, à valider. Index : `SPEC.md`.

## Objectif
Choisir le modèle (Opus, Sonnet, Haiku…) de la session ouverte et le changer à tout moment, sans perdre la conversation.

## Fonctionnement
1. **Liste déroulante dans l'en-tête du chat** avec 4 choix : « Par défaut » (pas d'option `--model` : c'est le réglage de Claude Code qui s'applique), « Opus », « Sonnet », « Haiku » (alias `opus`, `sonnet`, `haiku`, qui pointent toujours vers la dernière version).
   - À côté, on affiche le modèle réellement utilisé, lu dans l'événement `system/init` du flux (champ `model`, ex. `claude-opus-5-5`).
2. **Nouvelle session** : elle démarre avec le dernier modèle choisi. Ce choix est retenu dans `localStorage` (clé `mon-claude:model`), donc il survit à un redémarrage de l'app. Au tout premier lancement, c'est « Par défaut ».
   - Une session reprise depuis l'historique applique la même règle.
3. **Changement en cours de session** : l'app arrête le processus `claude` de la session, puis le relance avec `--resume <id> --model X` dans le même dossier. Le fil de la conversation reste affiché et continue.
   - Possible seulement quand aucune réponse n'est en cours : la liste est grisée pendant un tour.
   - Pendant ce redémarrage, la session ne doit pas apparaître comme « terminée » ou « en erreur » dans l'interface.
   - Le choix devient aussi le nouveau « dernier choisi ».
4. **Passation** : la session neuve reprend le modèle de la session résumée.

## Découpage
- Fonctions pures, testées :
  - `buildClaudeArgs({ sessionId, resume, model })` ajoute `--model X` seulement si `model` est défini.
  - Le parseur du flux émet un événement `{ type: 'model'; sessionId; model }` à la réception de `system/init`.
  - Lire et écrire le dernier choix dans `localStorage`, avec repli sur « Par défaut » si la valeur est inconnue ou illisible.
- main : `start(cwd, resumeId?, model?)` ; nouvelle méthode `restart(sessionId, model)` = `stop` sans signaler la fin à l'interface, puis `start(cwd, sessionId, model)`.
- preload / API : `startSession(cwd, { resumeId?, model? })` et `setModel(sessionId, model): Promise<void>` (canal `session:set-model`).
- renderer : composant `model-picker.tsx` dans l'en-tête ; l'état de la session gagne `model` (le choix) et `activeModel` (le modèle lu dans `init`).

## Hors périmètre
Niveau d'effort / réflexion, `--fallback-model`, noms de modèles complets saisis à la main, réglage d'un modèle différent par dossier, modification de `~/.claude/settings.json`.

## Critères de réussite
- Je choisis « Sonnet » sur une session, j'envoie un message → l'en-tête affiche un modèle `claude-sonnet-…` et le fil d'avant est toujours là. Le CLI se souvient bien des messages précédents (vérifié en lui posant la question).
- Je ferme l'app et je la rouvre, puis je crée une nouvelle session → elle part sur « Sonnet ».
- Pendant qu'une réponse s'écrit, la liste est grisée.
- Après une passation depuis une session « Haiku », la session neuve est en « Haiku ».
- « Par défaut » → la ligne de commande lancée ne contient pas `--model`.
- Tests Vitest : arguments avec et sans modèle, en mode `--resume` comme en mode `--session-id` ; événement `model` extrait d'une ligne `init` réelle (fixture) ; lecture du dernier choix (valeur connue, inconnue, absente) ; `restart` arrête puis relance avec les bons arguments sans émettre d'événement de fin (avec le faux CLI déjà utilisé dans les tests du session-manager).

## Questions ouvertes
- Est-ce que `stop` envoie aujourd'hui un événement de fin au renderer ? À vérifier dans `session-manager.ts` avant de coder `restart`.
