# Plan : attachments puis packaging

Specs : `SPEC-attachments.md`, `SPEC-packaging.md`. Méthode : TDD, 1 commit par tâche, pas de Co-Authored-By.

## Dépendances
```
A1 (vérif CLI) → A2 (📎 + envoi) → A3 (glisser-déposer) → A4 (Ctrl+V) → [Checkpoint A]
                                                                          ↓
                                     P1 (icône) → P2 (installeur) → P3 (vérif installée) → [Checkpoint B]
```
Le packaging vient en dernier : l'installeur contient ainsi les pièces jointes.

## Module attachments
- **A1 — Vérifier que Claude lit un fichier hors du dossier** (aucun code produit)
  Lancer le vrai CLI avec les arguments de `buildClaudeArgs` dans un dossier temporaire, envoyer « décris <chemin d'une image ailleurs> ».
  ✔ La réponse décrit l'image. Sinon, ajouter l'option nécessaire dans `claude-args.ts`, avec un test.
- **A2 — Bouton 📎 de bout en bout**
  `withAttachments` (pur, testé) ; IPC `files:pick` ; `pickFiles` dans le preload et `ClaudeApi` ; composer : étiquettes, ✕, envoi possible sans texte.
  ✔ Tests verts ; dans l'app, une photo jointe est décrite par Claude.
- **A3 — Glisser-déposer**
  `pathForFile` (`webUtils.getPathForFile`) dans le preload ; `onDrop` et `onDragOver` sur le composer.
  ✔ Test composer avec une fausse API ; dans l'app, un fichier glissé apparaît en étiquette.
- **A4 — Coller une capture**
  main : `savePastedImage(dir, bytes, ext)` testé avec un dossier temporaire ; IPC `files:save-pasted` ; `onPaste` dans le composer (seulement si le presse-papiers contient une image, sinon collage normal du texte).
  ✔ Tests verts ; dans l'app, Win+Maj+S puis Ctrl+V → étiquette → Claude décrit la capture.
- **Checkpoint A** : `npm test`, `typecheck`, `lint`, `build` OK ; les trois façons vérifiées dans la vraie app (CDP), plus un PDF.

## Module packaging
- **P1 — Icône** : `scripts/make-icon.mjs` (sans dépendance, PNG écrit avec `zlib`) → `build/icon.png` 256×256, versionné.
  ✔ Le fichier s'ouvre dans la visionneuse Windows.
- **P2 — Installeur** : `electron-builder` en devDependency ; champ `build` dans `package.json` (NSIS en un clic, par utilisateur, raccourcis Bureau et Démarrer, sortie dans `release/`) ; script `dist` ; `release/` dans `.gitignore`.
  ✔ `npm run dist` produit `release/Mon-Claude-Setup-0.1.0.exe`.
- **P3 — Vérification de l'app installée** (par l'utilisateur, guidé) : installer, lancer depuis le raccourci, envoyer un message, utiliser un skill, joindre une photo, relire l'historique, faire une passation, désinstaller.
  ✔ Tous les critères de `SPEC-packaging.md`, et `~/.claude/projects/` intact.
- **Checkpoint B** : specs marquées « terminée », passation écrite.

## Risques
- A1 négatif → une option de plus dans les arguments du CLI (prévue).
- electron-builder face à Electron 45 / electron-vite 6 → à voir en P2 ; repli : `electron-packager` + NSIS à la main (plus long).
- SmartScreen au 1er lancement (exe non signé) : normal, expliqué dans la spec.
