# Todo : module ui

## U1 : thèmes, typographie, finitions
- [x] `styles.css` : variables (`--bg --panel --text --muted --accent --accent-text --border --user …`) en sombre dans `:root`, clair crème sous `prefers-color-scheme: light` ; plus aucune couleur en dur
- [x] Polices (Segoe UI ; réponses en Cambria/Georgia, interligne 1,65 ; code en Cascadia Code/Consolas) et échelle 12/13/15/17/24 px
- [x] Boutons `.btn-primary`, `.btn-secondary`, `.btn-icon` ; focus orange ; barres de défilement fines ; fondus 150 ms coupés par `prefers-reduced-motion`
- [x] highlight.js clair/sombre (import retiré de `main.tsx`)
- Vérif : `npm test` (nouveau `tests/styles.test.ts` : aucune couleur hors blocs de variables), typecheck, lint, `npm run build` (media query hljs présente dans le CSS produit)
- Fichiers : `src/renderer/src/styles.css`, `src/renderer/src/main.tsx`, `tests/styles.test.ts`

## U2 : icônes lucide
- [x] `npm i lucide-react` ; remplacer 📎 📝 📖 ↻ × + ● ◌ et les icônes de `tool-line.tsx` (Read, Edit, Write, Bash, Grep, défaut)
- [x] Chaque bouton-icône a `aria-label` et `title`
- Vérif : `npm test` (nouveau test : aucun emoji/symbole-icône dans `src/renderer/src/**/*.tsx` ; tests existants adaptés aux `aria-label`), typecheck, lint
- Fichiers : `package.json`, `components/*.tsx`, tests concernés

## U3 : en-têtes
- [x] `ui-format.ts` : `folderLabel(path)` (dernier dossier ; gère `\`, `/` et le séparateur final)
- [x] En-têtes chat (`app.tsx`) et historique (`history-view.tsx`) : titre, dossier (chemin complet en `title`), %, badge « Lecture seule », bouton Passation secondaire
- Vérif : `npm test` (`folderLabel` : chemin Windows, slash final, racine ; rendu de l'en-tête), typecheck, lint
- Fichiers : `src/renderer/src/ui-format.ts`, `app.tsx`, `components/history-view.tsx`, `components/handoff-button.tsx`, tests

## Checkpoint A (après U1-U3)
- [x] test, typecheck, lint, build OK ; coup d'œil `npm run dev` en clair et en sombre

## U4 : menu du modèle dans la barre de saisie
- [x] `model-picker.tsx` : bouton (libellé du choix) + liste `role="listbox"` ; modèle réellement utilisé affiché dans le menu ; grisé pendant un tour
- [x] Clavier : flèches, Entrée, Échap ; un clic en dehors ferme
- [x] Retiré de l'en-tête, placé dans `composer.tsx` à côté du trombone
- Vérif : `npm test` (ouverture, choix → `onChange`, Échap ferme sans changer, flèches + Entrée), typecheck, lint
- Fichiers : `components/model-picker.tsx`, `components/composer.tsx`, `app.tsx`, `tests/model-picker.test.tsx`

## U5 : recherche dans l'historique
- [x] `filterHistory(projects, query)` : titre de session ou nom de projet, sans casse ni accents ; un projet qui correspond par son nom garde toutes ses sessions
- [x] Champ de recherche en haut de `history-list.tsx` ; projets filtrés ouverts ; « Aucun résultat »
- Vérif : `npm test` (« passa » ↔ « Passation », « éte » ↔ « ete », requête vide = tout, aucun résultat), typecheck, lint
- Fichiers : `ui-format.ts`, `components/history-list.tsx`, tests

## U6 : barre latérale
- [x] 260 px, sections « En cours » / « Historique », bouton « Nouvelle session » secondaire avec icône +
- [x] Repli : bouton + Ctrl+B, état dans `localStorage`
- [x] Point orange qui pulse pour une session en réponse ; jauges compactes
- Vérif : `npm test` (Ctrl+B replie/déplie, état relu au montage, sections présentes), typecheck, lint
- Fichiers : `components/sidebar.tsx`, `components/usage-gauges.tsx`, `app.tsx`, `styles.css`, tests

## U7 : écran d'accueil
- [x] `welcome.tsx` : logo « C », « Bonjour, que fait-on ? », bouton « Nouvelle session » (même action que dans la barre)
- Vérif : `npm test` (affiché sans session ouverte ; le bouton lance une session), typecheck, lint
- Fichiers : `components/welcome.tsx`, `app.tsx`, tests

## U8 : dialogue de passation
- [x] Coins arrondis, ombre, fond flouté, textarea en police d'interface ; « Annuler » secondaire, « Ouvrir une session neuve » principal ; Échap annule
- Vérif : `npm test` (`handoff-dialog.test.tsx` : Échap → `onCancel`), typecheck, lint
- Fichiers : `components/handoff-dialog.tsx`, `styles.css`, tests

## Checkpoint B (après U4-U8)
- [x] test (115 + nouveaux), typecheck, lint, build OK

## U9 : vérification dans la vraie app
- [x] `npm run dist`, réinstallation, lancement avec `--remote-debugging-port=9222`
- [x] Captures avant/après en sombre et en clair (CDP `Emulation.setEmulatedMedia`), contraste lisible
- [x] Parcours : envoyer un message, changer de modèle depuis la saisie, rechercher « passa », Ctrl+B puis redémarrage, passation + Échap, accueil
- [x] Console sans erreur
- Ensuite : `gardien-push`, puis `bash .claude/publier.sh …`
