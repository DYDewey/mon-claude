# Spec : module attachments

Brouillon du 25/10/2026, à valider. Index : `SPEC.md`.

## Objectif
Joindre n'importe quel fichier (photo, capture d'écran, PDF, code, texte…) à un message, pour que Claude le lise.

## Fonctionnement
1. **Principe** : l'app ne transmet pas le contenu du fichier mais son chemin complet, ajouté à la fin du message. Claude l'ouvre lui-même avec son outil Read, qui sait lire les images et les PDF. Zéro coût en plus et rien à convertir.
2. **Trois façons de joindre** :
   - bouton 📎 à côté de « Envoyer » → boîte de dialogue Windows, plusieurs fichiers possibles ;
   - glisser-déposer des fichiers sur la zone de saisie ;
   - Ctrl+V d'une image copiée (capture d'écran) : elle est enregistrée dans `%APPDATA%\mon-claude\attachments\AAAA-MM-JJ_HHhMMmSS.png`, puis jointe comme un fichier normal.
3. **Avant l'envoi** : les fichiers joints apparaissent en étiquettes (nom du fichier, ✕ pour retirer) au-dessus de la zone de saisie. On peut envoyer des fichiers sans texte.
4. **Message envoyé** : texte, puis une ligne vide, puis `Fichiers joints :` et une ligne `- <chemin>` par fichier. La bulle du chat affiche exactement ce texte.
5. Les étiquettes se vident après l'envoi. Rien ne se joint pendant qu'une réponse s'écrit, puisque la saisie est déjà grisée.

## Découpage
- Fonction pure `withAttachments(text, paths)` dans `src/shared/attachments.ts`.
- main : canal `files:pick` (dialogue `multiSelections`) et `files:save-pasted` (écrit l'image dans `attachments/`, renvoie le chemin).
- preload : `pickFiles()`, `savePastedImage(bytes, ext)`, `pathForFile(file)` (via `webUtils.getPathForFile`, car `File.path` n'existe plus dans Electron récent).
- renderer : `composer.tsx` gère la liste des fichiers joints et les trois façons de joindre.

## Hors périmètre
Miniatures d'aperçu, envoi du contenu en base64, limite de taille, nettoyage automatique de `attachments/`.

## Critères de réussite
- Je joins une photo avec 📎 et je demande « décris l'image » → Claude la décrit.
- Même chose par glisser-déposer, et avec une capture collée (Win+Maj+S puis Ctrl+V).
- Un PDF joint est lu (Claude en cite le contenu).
- Un fichier situé hors du dossier de la session est lu sans blocage de permission.
- Tests Vitest : `withAttachments` (sans fichier, sans texte, plusieurs fichiers) ; composer (ajout, retrait, envoi sans texte, vidage après envoi) ; enregistrement d'une image collée dans un dossier temporaire.

## Questions ouvertes
- Avec `-p --permission-mode acceptEdits`, Read accepte-t-il un fichier hors du dossier de la session ? À tester en vrai (tâche A1). Sinon : ajouter `--add-dir` ou une règle `--allowedTools "Read"`.
