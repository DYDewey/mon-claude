# Plan : module projects

Spec : `SPEC-projects.md` (validée le 25/10/2026 : champ `projects` dans `organize.json`, instructions aussi à la reprise et via « Nouvelle session »). Méthode : TDD, 1 commit par tâche (sans Co-Authored-By, sans `.claude/`).

## Décisions d'architecture
- Clé d'un projet : `p_` + 8 caractères aléatoires, créée côté renderer dans `addProject`. Le dossier n'est pas la clé (il peut contenir des `\` et changer de casse).
- Une seule source de vérité, comme `organize` : `OrganizeData` (avec `projects`) dans l'état de `app.tsx`, modifiée par fonctions pures, envoyée par `setOrganize`.
- Le main garde **une copie** de l'organize courant : chargée au démarrage, remplacée à chaque `organize:set` réussi. `SessionManager` reçoit `promptFor(cwd) => string | null` dans ses options : il ne connaît ni les projets ni le disque, donc il reste testable avec le faux `claude`.
- `promptFor` vérifie l'existence des fichiers de référence au moment du lancement (`existsSync`) et appelle `buildProjectPrompt(project, existingFiles)`.
- Le renderer a besoin de savoir si un dossier ou un fichier existe (projet grisé, fichier barré) : nouveau canal `paths:exist(paths) → boolean[]`.
- Les sessions d'un projet = `HistoryProject` dont `path` vérifie `sameFolder(path, project.folder)`. Rien de nouveau à lire sur disque.

## Graphe des dépendances
```
P1 fonctions pures + parseOrganize ─┬─ P2 injection dans main ──────────────┐
                                    └─ P3 section Projets + création ── P4 fiche du projet ── P5 indicateur ── P6 vérif vraie app
```
P2 et P3 sont indépendantes ; on les fait dans l'ordre P2 puis P3 (P2 = le cœur, testable seul).

## Tâches
- **P1 (S)** : `src/shared/projects.ts` + champ `projects` dans `parseOrganize`.
- **P2 (M)** : `appendSystemPrompt` dans `buildClaudeArgs`, `promptFor` dans `SessionManager`, copie de l'organize dans main.
- **P3 (M)** : section « Projets » (dépliable, sessions du projet, `+` au survol), « + Projet » → choix du dossier → projet créé et sauvé.
- **P4 (M)** : fiche du projet (nom, instructions, fichiers, supprimer, nouvelle session), canal `paths:exist`, grisé/barré.
- **P5 (S)** : « Projet : X » dans la barre du haut quand la session active est dans un projet.
- **P6 (S)** : vérification CDP dans l'app installée (test 🦊), redémarrage, `.jsonl` inchangés.

## Risques
- Instructions avec guillemets, retours à la ligne ou accents : `spawn` sans shell passe l'argument tel quel ; un test le vérifie avec le faux `claude`.
- Ligne de commande Windows limitée à 32 767 caractères : instructions coupées à 10 000 dans `parseOrganize`, fichiers limités à 50.
- Instructions modifiées pendant qu'une session tourne : elles s'appliquent au prochain lancement (nouvelle session, reprise ou changement de modèle). À dire dans la fiche par une petite phrase.
- Passation : la session neuve repart du même `cwd`, donc reçoit les instructions du projet. C'est voulu (critère de la spec).

## Point de contrôle
Après P4 : tests, typecheck, lint et build verts, puis essai rapide en `npm run dev` avant P5 et P6.
