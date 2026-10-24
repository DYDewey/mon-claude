# Spec : module history

Validée le 24/10/2026. Index : `SPEC.md`.

## Objectif
Rouvrir et relire n'importe quelle ancienne conversation `claude`, de n'importe quel projet, depuis l'app.
**Lecture seule** : on n'écrit, ne déplace et ne supprime jamais rien dans `~/.claude/projects/`.

## Source (constaté le 24/10, CLI 2.1.x, 15 dossiers, 72 `.jsonl`, 43 Mo, le plus gros fait 4,9 Mo)
- `~/.claude/projects/<dossier>/<sessionId>.jsonl` : un fichier = une session. Les sous-dossiers (`memory/`…) sont ignorés.
- Nom du dossier = chemin encodé (`C--Users-moi-Documents-mon-claude`), et on ne peut pas le décoder de façon fiable. Le vrai chemin vient du champ `cwd` des lignes `user`/`assistant`, sinon on affiche le nom du dossier.
- Titre de la session : dernier `custom-title.customTitle`, sinon dernier `ai-title.aiTitle`, sinon début du 1er message `user` texte, sinon « Sans titre ».
- Date : `timestamp` de la dernière ligne qui en a un, sinon date de modification du fichier.
- Lignes à afficher : `user` (texte), `assistant` (blocs `text`, `tool_use`). Les `tool_result` sont ignorés (le chat ne les affiche pas non plus). Tout le reste est ignoré (`attachment`, `api-request*`, `system`, `mode`, `file-history-*`…).
- Ligne JSON cassée ou type inconnu : on l'ignore sans planter (le format n'est pas garanti stable).

## Fonctionnement
- **main** : `history-reader.ts`
  - `listSessions()` : parcourt les dossiers, lit chaque fichier en flux (ligne par ligne) pour sortir titre, date, projet et nombre de messages. Résultat gardé en mémoire et invalidé si la date de modification du fichier change.
  - `readSession(projet, id)` : lit le fichier complet et renvoie une liste de messages au format déjà utilisé par le chat. Le renderer ne voit jamais le JSON brut.
  - Ouverture des fichiers en lecture uniquement (`fs.createReadStream` / `readFile`), et le chemin demandé doit rester dans `~/.claude/projects/` (protection contre `..`).
- **preload / IPC** : `history:list`, `history:read`.
- **renderer** :
  - Barre latérale : une section « Historique » sous les sessions en cours. Projets repliables, triés par activité récente, et sessions triées de la plus récente à la plus ancienne (titre + « il y a 2 j »).
  - Clic sur une session : affichage dans la zone de chat avec les composants existants (`message.tsx`, `tool-line.tsx`), un bandeau « Lecture seule » et aucune zone de saisie.
  - Bouton ↻ pour rafraîchir la liste.

## Hors périmètre
Reprendre une conversation (`--resume`), recherche plein texte, suppression, renommage, export, les sous-agents (sidechains) affichés à part, les images.

## Critères de réussite
- Toutes les sessions de `~/.claude/projects/` apparaissent, rangées par projet, avec un titre lisible.
- Clic sur une session : ses messages et outils s'affichent comme dans le chat, en lecture seule.
- Le fichier de 4,9 Mo s'ouvre en moins de 2 s.
- Les fichiers `.jsonl` ne sont pas modifiés (date de modification identique avant/après).
- Tests Vitest : extraction titre/date/projet, conversion des lignes en messages, lignes cassées ignorées, refus d'un chemin hors de `~/.claude/projects/`.
