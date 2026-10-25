# Spec : module projects

Validée le 25/10/2026 (questions 1-3 : propositions retenues). Index : `SPEC.md`. Dépend de `organize` et `chat`.

## Objectif
Un **projet** = un dossier de travail + un nom + des **instructions** + des **fichiers de référence**. Les sessions lancées dans ce dossier sont regroupées sous le projet, et chaque nouvelle session reçoit automatiquement les instructions et la liste des fichiers. Exemple : projet « Cours React » sur `D:\Cours\react`, instructions « Explique simplement, je débute », fichier `D:\Cours\react\sujet.pdf`.

## Hypothèses (à corriger maintenant si fausses)
1. Un projet est **lié à un dossier** (un seul projet par dossier). Pas d'affectation manuelle : une session appartient au projet si elle a été lancée dans son dossier. C'est déjà comme ça que `history` regroupe les `.jsonl`.
2. Les instructions passent par `--append-system-prompt` : invisibles dans le chat, valables pour toute la session, et rien n'est écrit dans le dossier de l'utilisateur (pas de `CLAUDE.md` créé).
3. Les fichiers ne sont pas envoyés en contenu : comme `attachments`, l'app donne leur **chemin** dans le prompt système, et Claude les lit avec Read quand c'est utile.
4. Les projets sont rangés dans `organize.json` (prévu par `SPEC-organize.md`). **Changement de format → ta validation est requise** (voir point 6).

## Fonctionnement
1. **Section « Projets »** dans la barre latérale, au-dessus de « Favoris » : un projet par ligne (icône lucide `FolderKanban`, nom). Un clic déplie ses sessions (celles de l'historique dont le dossier = dossier du projet, plus récentes d'abord, avec étoiles et noms d'`organize`). Section cachée s'il n'y a aucun projet, mais un bouton « + Projet » reste visible.
2. **Créer** : « + Projet » → choix du dossier (dialogue Windows existant `pickFolder`) → fiche du projet avec le nom pré-rempli (nom du dossier). Si le dossier a déjà un projet, on ouvre sa fiche.
3. **Fiche du projet** (vue principale, comme la relecture) : nom, dossier (lecture seule), zone de texte « Instructions », liste des fichiers (📎 pour ajouter via `pickFiles`, ✕ pour retirer), bouton « Nouvelle session », bouton « Supprimer le projet » (supprime seulement la fiche, jamais les sessions ni les fichiers). Enregistrement à la sortie du champ.
4. **Nouvelle session dans un projet** : bouton de la fiche, ou icône `+` au survol du projet. Lance une session dans le dossier, sans redemander le dossier.
5. **Règle d'injection (dans main)** : à chaque lancement de `claude` (nouvelle session, reprise, changement de modèle, session neuve après passation), si `cwd` correspond au dossier d'un projet qui a des instructions ou des fichiers, main ajoute :
   ```
   --append-system-prompt "Instructions du projet « Cours React » :
   Explique simplement, je débute

   Fichiers de référence du projet (lis-les avec Read si utile) :
   - D:\Cours\react\sujet.pdf"
   ```
   Comparaison des dossiers insensible à la casse et aux `\` finaux (Windows). Un indicateur discret dans la barre du haut (« Projet : Cours React ») montre que les instructions sont actives.
6. **Persistance** : `organize.json` garde `version: 1` et gagne un champ facultatif `projects` (un ancien fichier sans ce champ reste valide) :
   ```json
   { "version": 1, "sessions": { … },
     "projects": { "p_k3x9": { "name": "Cours React", "folder": "D:\\Cours\\react",
                               "instructions": "Explique simplement…", "files": ["D:\\Cours\\react\\sujet.pdf"] } } }
   ```
   `parseOrganize` valide et nettoie : entrée sans `name`/`folder` texte ignorée, `files` non-texte retirés, clés `__proto__` & co rejetées, instructions coupées à 10 000 caractères (limite de la ligne de commande Windows : 32 767).
7. **Robustesse** : dossier du projet disparu → projet affiché grisé, « Nouvelle session » désactivée. Fichier de référence disparu → affiché barré dans la fiche et **non envoyé**.

## Hors périmètre
- Plusieurs projets sur un même dossier, ou une session déplacée à la main vers un autre projet.
- Envoi du contenu des fichiers (base64), copie des fichiers dans l'app.
- Écriture d'un `CLAUDE.md` dans le dossier de l'utilisateur.
- Couleurs, icônes personnalisées, ordre manuel des projets.

## Découpage
- `src/shared/projects.ts` : type `Project`, fonctions pures `addProject`, `updateProject`, `removeProject`, `projectForCwd(data, cwd)`, `sameFolder(a, b)`, `projectSessions(projects, project)`, `buildProjectPrompt(project, existingFiles)` (renvoie `null` si rien à envoyer).
- `src/shared/organize.ts` : `OrganizeData.projects?`, validation dans `parseOrganize`.
- `src/main/claude-args.ts` : option `appendSystemPrompt?: string`.
- `src/main/session-manager.ts` : reçoit une fonction `promptFor(cwd)` (injectée, donc testable) appelée à chaque `launch`.
- `src/main/ipc.ts` / `index.ts` : brancher `promptFor` sur l'organize courant (relu après chaque `setOrganize`).
- Renderer : nouvelle `projects-list.tsx`, nouvelle `project-view.tsx` (fiche), `app.tsx` (état, vue active, « Nouvelle session »), indicateur dans la barre du haut, `styles.css`.

## Tests
- Vitest, pur (`tests/projects.test.ts`) : ajout/modif/suppression, `sameFolder` (`D:\Cours\React\` = `d:\cours\react`), `projectForCwd`, `projectSessions`, `buildProjectPrompt` (rien → `null`, instructions seules, fichiers seuls, fichier disparu exclu).
- `parseOrganize` : ancien fichier sans `projects`, projet invalide ignoré, `__proto__` rejeté, instructions trop longues coupées.
- `buildClaudeArgs` avec et sans `appendSystemPrompt` ; `SessionManager` (faux `claude` existant des tests) : l'argument est passé au lancement **et** au relancement (changement de modèle).
- Composants (`renderToStaticMarkup`) : section cachée si aucun projet, sessions du projet listées, projet grisé si dossier absent, fichier barré si absent.
- Vrai test dans l'app (CDP) : créer un projet avec l'instruction « Termine chaque réponse par 🦊 », lancer une session, demander « Dis bonjour » → la réponse finit par 🦊. Session lancée hors projet → pas de 🦊.

## Limites
- Toujours : tests avant chaque commit, un commit par tâche, aucune écriture dans `~/.claude/` ni dans le dossier du projet.
- Demander d'abord : nouvelle dépendance, tout autre changement du format d'`organize.json`.
- Jamais : modifier/supprimer un `.jsonl` ou un fichier de référence, appel payant, clé API.

## Critères de réussite
- Je crée « Cours React » sur un dossier, j'y ajoute une instruction et un PDF ; une nouvelle session du projet suit l'instruction et sait lire le PDF quand je lui demande.
- Les sessions déjà faites dans ce dossier apparaissent sous le projet.
- Une session lancée dans un autre dossier ne reçoit rien.
- Après une passation dans le projet, la nouvelle session reçoit le résumé **et** les instructions du projet (rien d'autre de l'ancienne session).
- Après redémarrage de l'app, les projets sont toujours là ; supprimer un projet ne touche à aucune session ni aucun fichier.
- Les 195 tests existants restent verts.

## Questions ouvertes
1. **Format** : OK pour ajouter `projects` dans `organize.json` (version 1, champ facultatif) ?
2. Une session **reprise** depuis l'historique dans le dossier du projet reçoit aussi les instructions (proposé, plus simple et cohérent) — ou seulement les sessions neuves ?
3. Le bouton actuel « Nouvelle session » (choix du dossier) : s'il tombe sur le dossier d'un projet, les instructions s'appliquent aussi (proposé, découle de la règle 5) — OK ?
