# Plan : module ui

Spec : `SPEC-ui.md` (validée le 25/10/2026). Méthode : TDD, 1 commit par tâche (sans Co-Authored-By, sans `.claude/`).

## Décisions d'architecture
- Thèmes 100 % CSS : variables dans `:root` (sombre par défaut) redéfinies sous `@media (prefers-color-scheme: light)`. Aucun JS : Chromium suit en direct la bascule de Windows.
- highlight.js : `github-dark.css` et `github.css` importés depuis `styles.css` avec `@import ... (prefers-color-scheme: …)`. Si Vite ne garde pas la media query, copier les règles utiles dans `styles.css`, branchées sur les variables.
- Garde-fou testé : un test lit `styles.css` et échoue s'il trouve une couleur (`#hex`, `rgb(`) en dehors des blocs de variables.
- Icônes : `lucide-react` (imports nommés). Un test vérifie qu'aucun composant ne contient d'emoji ni de symbole-icône (📎 📝 📖 🔧 ↻ × ● ◌…).
- Fonctions pures dans `src/renderer/src/ui-format.ts` : `folderLabel(path)`, `filterHistory(projects, query)` (NFD, accents retirés, minuscules).
- Repli de la barre : état dans `app.tsx`, retenu dans `localStorage` (comme le modèle et les jauges), Ctrl+B écouté sur `window`.
- Menu du modèle : composant maison (bouton + `role="listbox"`) avec le même callback `onChange` qu'aujourd'hui, donc rien ne change côté main.

## Graphe des dépendances
```
U1 thèmes + typo + boutons ─┬─ U2 icônes lucide
                            ├─ U3 en-têtes + folderLabel
                            ├─ U4 menu modèle dans la saisie
                            ├─ U5 recherche historique ── U6 barre latérale (sections, repli)
                            ├─ U7 accueil
                            └─ U8 dialogue de passation
                                         └─ U9 vérification dans la vraie app
```
U2 à U8 ne dépendent que de U1 (variables, variantes de boutons). U6 vient après U5 : les deux touchent la barre latérale.

## Tâches
- **U1 (M)** : variables par thème (clair crème), échelle typo, polices, variantes de boutons, focus, barres de défilement, fondus + `prefers-reduced-motion`, highlight.js clair/sombre.
- **U2 (S)** : `lucide-react`, remplacement de tous les emojis/symboles, `aria-label` + `title` sur les boutons-icônes.
- **U3 (S)** : `folderLabel` ; en-têtes de `app.tsx` et `history-view.tsx` (titre, dossier, %, badge, Passation discrète).
- **U4 (M)** : `model-picker.tsx` maison, déplacé dans `composer.tsx` ; souris + flèches/Entrée/Échap.
- **U5 (M)** : `filterHistory` + champ de recherche dans `history-list.tsx`.
- **U6 (M)** : barre latérale 260 px, sections « En cours »/« Historique », repli (bouton + Ctrl+B, retenu), point orange qui pulse, jauges compactes.
- **U7 (S)** : `welcome.tsx` quand aucune session n'est ouverte.
- **U8 (S)** : dialogue de passation restylé, Échap annule.
- **U9** : vérification CDP dans l'app installée, captures clair/sombre, console propre.

## Risques
| Risque | Impact | Parade |
|---|---|---|
| `@import` avec media query non conservé par Vite | Moyen | Vérifié en U1 sur `npm run build` ; sinon règles hljs copiées dans `styles.css` |
| Contraste AA insuffisant en clair (orange sur crème) | Moyen | Texte orange plus foncé (`--accent-text`) distinct de l'orange des fonds ; contrôlé sur captures en U9 |
| Ctrl+B avalé par la zone de saisie | Bas | Écouteur `window` en phase de capture ; testé en U6 |
| Tests existants qui cherchent un emoji (ex. « 📎 ») | Bas | Adaptés en U2 pour chercher l'`aria-label` |

## Questions ouvertes
Aucune.
