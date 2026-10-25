# Todo : module projects

- [x] **P1** Fonctions pures et format
  - Acceptation : `src/shared/projects.ts` exporte `Project`, `addProject`, `updateProject`, `removeProject`, `sameFolder`, `projectForCwd`, `projectSessions`, `buildProjectPrompt` ; `OrganizeData.projects?` ; `parseOrganize` garde les projets valides, ignore les invalides, rejette `__proto__`, coupe les instructions à 10 000 caractères et les fichiers à 50 ; un ancien fichier sans `projects` reste valide.
  - Vérif : `npm test` (nouveau `tests/projects.test.ts` + cas ajoutés à `tests/organize.test.ts`), `npm run typecheck`.
  - Fichiers : `src/shared/projects.ts`, `src/shared/organize.ts`, `tests/projects.test.ts`, `tests/organize.test.ts`.

- [x] **P2** Injection des instructions au lancement de claude
  - Acceptation : `buildClaudeArgs({ appendSystemPrompt })` ajoute `--append-system-prompt <texte>` ; `SessionManager` appelle `promptFor(cwd)` à chaque `launch` (start, reprise, restart) ; main tient une copie de l'organize (chargée au démarrage, remplacée après `organize:set`) et ne passe que les fichiers existants.
  - Vérif : tests `claude-args` et `session-manager` (le faux claude reçoit l'argument avec guillemets, retours à la ligne et accents intacts, au lancement et après changement de modèle ; rien si `promptFor` renvoie `null`).
  - Fichiers : `src/main/claude-args.ts`, `src/main/session-manager.ts`, `src/main/ipc.ts`, tests associés.

- [x] **P3** Section « Projets » et création
  - Acceptation : section au-dessus de « Favoris », cachée sans projet mais « + Projet » visible ; « + Projet » → `pickFolder` → projet créé (nom = nom du dossier) ou fiche existante si le dossier a déjà un projet ; un clic déplie les sessions du projet (étoiles et noms d'`organize`) ; `+` au survol lance une session dans le dossier.
  - Vérif : tests `renderToStaticMarkup` (section cachée/visible, sessions listées) ; `npm run typecheck`, `npm run lint`.
  - Fichiers : `src/renderer/src/components/projects-list.tsx`, `src/renderer/src/app.tsx`, `src/renderer/src/styles.css`, `tests/projects-list.test.tsx`.

- [x] **P4** Fiche du projet
  - Acceptation : vue avec nom, dossier, instructions (enregistrées à la sortie du champ, phrase « s'applique aux prochains lancements »), fichiers (📎 / ✕), « Nouvelle session », « Supprimer le projet » (ne touche ni sessions ni fichiers) ; canal `paths:exist` ; projet grisé et « Nouvelle session » désactivée si dossier absent ; fichier barré si absent.
  - Vérif : tests composants (grisé, barré, liste de fichiers) ; test du canal sur dossier temporaire ; build vert.
  - Fichiers : `src/renderer/src/components/project-view.tsx`, `src/renderer/src/app.tsx`, `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/api.ts`.

- [ ] **Point de contrôle** : tests, typecheck, lint, build verts + essai `npm run dev`.

- [x] **P5** Indicateur « Projet : X »
  - Acceptation : la barre du haut affiche le nom du projet quand le `cwd` de la session active correspond à un projet avec instructions ou fichiers.
  - Vérif : test composant ; `npm test`.
  - Fichiers : `src/renderer/src/app.tsx` (ou composant de la barre du haut), test.

- [ ] **P6** Vérification dans la vraie app
  - Acceptation : projet avec « Termine chaque réponse par 🦊 » → session du projet finit par 🦊, session hors projet non ; après redémarrage le projet est là ; suppression du projet sans effet sur les sessions ; empreinte des `.jsonl` identique avant/après.
  - Vérif : script CDP (barre latérale à déplier d'abord), `npm run dist` puis installation.
  - Fichiers : `tasks/` archivés, `SPEC.md` (`projects` ✅).
