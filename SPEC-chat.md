# Spec module : chat

Règles communes : voir `SPEC.md`. S'appuie sur `window.claude` (module `cli-bridge`, terminé).

## Objectif
La fenêtre principale, « comme l'app Claude, mais la mienne » : plusieurs sessions ouvertes en même temps, réponses affichées en direct, en Markdown.

## Interface
```
┌──────────────┬──────────────────────────────────────────┐
│ + Nouvelle   │  Titre de la session · dossier            │
│──────────────│──────────────────────────────────────────│
│ ● Session A  │  Moi : …                                 │
│ ◌ Session B  │  Claude : … (Markdown, code coloré)       │
│   Session C  │  ✏️ Edit src/app.tsx   [déplier]          │
│              │                                          │
│              │──────────────────────────────────────────│
│              │  [ zone de saisie ]       [Envoyer/Stop]  │
└──────────────┴──────────────────────────────────────────┘
● réponse en cours   ◌ nouvelle réponse non lue
```

## Fonctionnalités
1. **Nouvelle session** : bouton « + », choix du dossier (boîte de dialogue Windows), la session apparaît dans la barre latérale.
2. **Plusieurs sessions en parallèle** : chacune a son processus `claude` ; une session en arrière-plan continue de recevoir sa réponse.
3. **Barre latérale** : titre (= début du 1er message), indicateur « en cours » / « non lu », bouton fermer (arrête le processus).
4. **Envoi** : Entrée envoie, Maj+Entrée fait un saut de ligne. Saisie bloquée pendant une réponse.
5. **Affichage en direct** : le texte s'ajoute au fil des `text-delta` ; « Claude démarre… » tant que rien n'est arrivé (~35 s au 1er message).
6. **Markdown** : `react-markdown` + coloration des blocs de code ; pas de HTML brut interprété.
7. **Outils** : une ligne compacte par appel d'outil (icône + nom + cible principale), dépliable pour voir les paramètres.
8. **Stop** : interrompt la réponse en cours sans perdre la session.
9. **Erreurs** : un événement `error` s'affiche dans la conversation, lisible, sans planter l'app.

## Changements dans cli-bridge
- Nouvel événement `tool-use` : `{ sessionId, name, input }`, lu dans les blocs `tool_use` des messages `assistant`.
- Nouvelle API `pickFolder(): Promise<string | null>` (boîte de dialogue côté main).
- Nouvelle API `interrupt(sessionId)` : à vérifier sur le vrai CLI (requête de contrôle `interrupt` sur stdin) ; sinon arrêt du processus puis relance avec `--resume`.

## Organisation du code
```
src/renderer/src/
  app.tsx                 → mise en page (barre latérale + session active)
  state/sessions.ts       → état de toutes les sessions (reducer pur, testé)
  components/sidebar.tsx
  components/chat-view.tsx
  components/message.tsx  → rendu Markdown
  components/tool-line.tsx
  components/composer.tsx → zone de saisie + Envoyer/Stop
```
L'état est un **reducer pur** (événement → nouvel état) : testable avec Vitest sans interface.

## Critères de réussite
- Reducer testé : `text-delta` s'ajoute au bon message de la bonne session ; `turn-end` termine le tour ; événement d'une session en arrière-plan → marquée « non lue ».
- Parser testé : un message `assistant` avec `tool_use` donne un événement `tool-use`.
- Manuel : 2 sessions dans 2 dossiers, une question dans chacune, les deux réponses arrivent en parallèle.
- Manuel : un bloc de code s'affiche coloré ; une liste Markdown s'affiche en liste.
- Manuel : Stop arrête la réponse, et un nouveau message dans la même session fonctionne (Claude se souvient du début).
- Manuel : une de mes skills perso (ex. `/aide-decision`) fonctionne dans l'app.

## Hors périmètre
- Jauges de tokens et limites (module `usage`).
- Rouvrir une ancienne conversation (module `history`).
- Choix du modèle, pièces jointes, images.
- Sauvegarde des sessions ouvertes à la fermeture de l'app.

## Questions ouvertes
- `interrupt` via stdin marche-t-il en mode `-p` stream-json ? (vérification en 1re tâche du plan)
- Dépendances à ajouter : `react-markdown`, `remark-gfm`, `rehype-highlight` (accord donné pour le Markdown).
