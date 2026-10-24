# Spec : module handoff

Validée le 24/10/2026. Index : `SPEC.md`.

## Objectif
Bouton « Passation » : Claude rédige un résumé de la session en cours, je le relis et le modifie, puis une session **neuve** s'ouvre et ne reçoit que ce résumé.
Ça sert à repartir avec un contexte léger sans perdre le fil. L'historique complet reste consultable (module history).

## Fonctionnement
1. **Rédaction (dans la session en cours)** : le bouton « Passation » (en-tête du chat) envoie à la session ouverte une consigne fixe : « rédige une passation selon ce modèle », avec le modèle de garde-contexte (Objectif, Où on en est, Contexte, Décisions, Fait, Reste à faire, Fichiers & commandes, Pièges ; 40 lignes max ; ne rien inventer). La consigne et la réponse s'affichent normalement dans le chat.
   - Le modèle est copié dans `src/shared/handoff-prompt.ts`, pour ne pas dépendre du skill installé dans `~/.claude`.
   - Le bouton est actif seulement si la session a au moins un échange et qu'aucune réponse n'est en cours.
2. **Relecture** : à la fin du tour (`turn-end`), le texte du dernier message assistant ouvre une fenêtre d'édition (textarea pré-remplie) avec deux boutons : « Annuler » et « Ouvrir une session neuve ».
   - Si le tour échoue, est interrompu ou renvoie un texte vide, la fenêtre ne s'ouvre pas et un message d'erreur s'affiche dans le chat.
   - Si la zone de texte est vide, le bouton de validation est désactivé.
3. **Nouvelle session** :
   - main : `handoff:save(text, cwd)` écrit `%APPDATA%/mon-claude/handoffs/AAAA-MM-JJ_HHhMM_<6 premiers caractères de l'id>.md` (`app.getPath('userData')/handoffs`, dossier créé si besoin) et renvoie le chemin.
   - renderer : `startSession(même cwd)` sans `--resume`, puis `sendMessage(texte relu)` tel quel, comme 1er message visible. La nouvelle session devient la session active.
   - L'ancienne session reste ouverte dans la barre latérale (je la ferme moi-même si je veux).

## Découpage
- Fonctions pures testées : `buildHandoffPrompt()`, `lastAssistantText(items)`, `handoffFileName(date, sessionId)`.
- main : `src/main/handoff-store.ts` (`saveHandoff`, écriture seulement dans le dossier handoffs) + `registerHandoffIpc` dans `ipc.ts`.
- preload / API : `saveHandoff(text, cwd): Promise<string>`, canal `handoff:save`.
- renderer : bouton dans l'en-tête du chat, `handoff-dialog.tsx`, et l'état « passation en attente » (id de la session concernée) dans `app.tsx`.

## Hors périmètre
Liste ou relecture des passations dans l'app, passation automatique quand le contexte est plein, suppression d'une passation, prompt système invisible, choix d'un autre dossier de travail pour la session neuve.

## Critères de réussite
- Clic sur « Passation » → la consigne part, et le résumé s'affiche en direct puis s'ouvre dans la fenêtre d'édition.
- Je modifie le texte, je valide → un `.md` identique au texte relu existe dans `%APPDATA%/mon-claude/handoffs/`.
- Le `.jsonl` de la nouvelle session ne contient qu'un seul message utilisateur : le résumé relu (vérifié sur disque).
- « Annuler » ne crée ni fichier ni session.
- Aucun fichier de `~/.claude/projects/` n'est modifié par l'app (hors ceux que le CLI écrit pour ses propres sessions).
- Tests Vitest : prompt (contient chaque section du modèle), extraction du dernier texte assistant (ignore les outils, vide si aucun), nom de fichier, `saveHandoff` qui écrit dans un dossier temporaire et refuse un id contenant `..` ou `/`.
