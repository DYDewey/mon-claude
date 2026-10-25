# Plan : module organize

Spec : `SPEC-organize.md` (validée le 25/10/2026 : liste plate, crayon seul). Méthode : TDD, 1 commit par tâche (sans Co-Authored-By, sans `.claude/`).

## Décisions d'architecture
- Clé d'une session : `"<dossier>/<id>"`, le même format que `openKey` dans `history-list.tsx`.
- Une seule source de vérité : `OrganizeData` vit dans l'état de `app.tsx`. Chaque changement passe par une fonction pure (`toggleFavorite`, `renameSession`), met à jour l'état, puis appelle `window.claude.setOrganize(data)` sans attendre la réponse. Une erreur d'écriture s'affiche dans la console, sans bloquer l'interface.
- Le main ne fait pas confiance au renderer : `setOrganize` repasse la donnée reçue dans `parseOrganize` avant d'écrire.
- Écriture atomique : on écrit `organize.json.tmp`, puis on fait `rename`. Si le fichier existant est illisible, on le copie en `organize.json.bak` une seule fois avant la première écriture.
- `filterHistory(projects, query, titles?)` reçoit une fonction qui donne le titre affiché. Ainsi `ui-format.ts` ne dépend pas d'`organize`.
- Logique clavier du renommage en fonction pure `renameKey(key)` → `'save' | 'cancel' | null` (tests sans DOM, comme `menuKey`).

## Graphe des dépendances
```
O1 fonctions pures ── O2 stockage + IPC ─┬─ O3 étoile + section Favoris ─┐
                                         └─ O4 renommage + recherche ────┴─ O5 en-tête relecture ── O6 vérif vraie app
```
O3 et O4 touchent tous deux `history-list.tsx` : on les fait l'un après l'autre (O3 puis O4).

## Tâches
- **O1 (S)** : `src/shared/organize.ts` : types et fonctions pures.
- **O2 (M)** : `organize-store.ts`, IPC `organize:get` / `organize:set`, preload, `ClaudeApi` ; `app.tsx` charge les données au démarrage.
- **O3 (M)** : étoile au survol dans l'historique, section « Favoris », sauvegarde.
- **O4 (M)** : crayon + champ de renommage, titre personnalisé partout, recherche dans le nom.
- **O5 (S)** : étoile et crayon dans l'en-tête de `history-view.tsx`.
- **O6 (S)** : vérification CDP dans l'app installée, redémarrage, `.jsonl` inchangés.

## Risques
- Clic sur l'étoile ou le crayon qui ouvre aussi la session : `stopPropagation`, comme le bouton « Fermer ».
- Deux écritures rapprochées (double clic) : l'écriture atomique garantit qu'il reste toujours un fichier complet ; la dernière écriture gagne.
- `userData` : vérifier le vrai nom du dossier (`Mon-Claude` ou `mon-claude`) et corriger la spec s'il diffère.

## Point de contrôle
Après O4 : tests, typecheck, lint et build verts, puis essai rapide en `npm run dev` avant O5 et O6.
