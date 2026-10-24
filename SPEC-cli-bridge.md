# Spec module : cli-bridge

Règles communes (stack, commandes, style, limites) : voir `SPEC.md`.

## Objectif
Côté main, lancer et piloter une session `claude`, et transformer son flux JSON en événements simples pour le renderer.

## Fonctionnement
- Une conversation = un processus enfant qui reste ouvert :
  ```
  claude -p --input-format stream-json --output-format stream-json
         --verbose --include-partial-messages
         --permission-mode acceptEdits
  ```
  lancé avec `cwd` = dossier choisi par l'utilisateur.
- Envoyer un message = écrire une ligne JSON sur `stdin`.
- Lire `stdout` ligne par ligne, chaque ligne = un objet JSON → traduit en `BridgeEvent`.
- Reprendre une session existante : même commande + `--resume <session-id>`.
- Pas d'option `--bare` : les skills, CLAUDE.md et settings perso sont chargés normalement.

## Interface (exposée au renderer via preload)
```ts
startSession(cwd: string, opts?: { resumeId?: string }): Promise<string> // renvoie sessionId
sendMessage(sessionId: string, text: string): void
stopSession(sessionId: string): void
onEvent(cb: (e: BridgeEvent) => void): () => void // renvoie la fonction de désabonnement
```

## Critères de réussite
- Le parser transforme une fixture de flux réelle en la bonne suite de `text-delta` puis `turn-end` (test Vitest).
- Une ligne JSON invalide ou un type inconnu ne fait pas planter : elle est ignorée (et loguée).
- Une ligne coupée en deux morceaux de `stdout` est bien recollée avant parsing (test).
- Si `claude` est introuvable ou se ferme avec une erreur, un événement `error` lisible est émis.
- Vérif manuelle : depuis la console de dev, `sendMessage` d'un « bonjour » affiche les morceaux de réponse au fil de l'eau.
- `stopSession` tue le processus ; fermer l'app ne laisse aucun processus `claude` orphelin.

## Hors périmètre
- Aucune interface graphique (c'est `chat`).
- Pas de popup de permission (mode `acceptEdits` fixe en V1).

## Questions ouvertes
- Résolu : on impose notre propre identifiant avec `--session-id` (ou `--resume`), connu avant la première réponse.
