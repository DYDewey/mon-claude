# Plan : module usage (+ suggestion)

Spec : `SPEC-usage.md`. Plan précédent : `tasks/archive/chat-plan.md`.

## Décisions
- Le parser (main) fait les calculs bruts et envoie 3 nouveaux `BridgeEvent` : `rate-limits`, `context`, `suggestion`. Le renderer ne voit jamais le JSON du CLI.
- Contexte : le parser retient l'usage du dernier message `assistant` et l'envoie avec le `contextWindow` du `result`.
- Jauges = état global de l'app (comme `commands`) ; contexte et suggestion = état de chaque session.
- Calculs d'affichage (%, couleur, heure de reset, « il y a X min ») dans `usage-format.ts`, fonctions pures testées.

## Graphe
```
U1 parser ─┐
U2 args ───┼─→ U3 reducer ─→ U4 jauges + contexte ─→ U5 suggestion (composer)
```
