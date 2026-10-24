# Plan : module cli-bridge

## Vue d'ensemble
Construire le pont main ↔ `claude` décrit dans `SPEC-cli-bridge.md` : lancer une session, envoyer des messages, recevoir la réponse en flux sous forme de `BridgeEvent`, le tout exposé au renderer via le preload. Pas d'interface de chat ici (module `chat`).

## Décisions d'architecture
- `claude.exe` est lancé directement avec `child_process.spawn` (pas de shell) : plus sûr, pas de problème de guillemets.
- Le parsing du flux est une fonction pure (texte → événements), séparée du processus : testable sans lancer `claude`.
- On capture d'abord un vrai flux (tâche 1) : c'est le point le plus risqué, on le vérifie avant de coder.

## Graphe des dépendances
```
T1 capture flux réel ──┐
T2 squelette projet ───┼── T3 parser de flux ── T4 gestion du processus ── T5 preload + IPC
```

## Tâches
- [x] T1 : capturer un vrai flux stream-json (fixture) — S
- [x] T2 : squelette electron-vite + React + Vitest — M
- [ ] Checkpoint A
- [ ] T3 : parser de flux → BridgeEvent — S
- [ ] T4 : démarrer / envoyer / arrêter une session — M
- [ ] T5 : exposer l'API au renderer (preload + IPC) — S
- [ ] Checkpoint B (module terminé)

Détail des tâches : `tasks/todo.md`.

## Risques
| Risque | Impact | Parade |
|---|---|---|
| Le format d'entrée stream-json n'est pas celui supposé | Haut | T1 le vérifie sur le vrai CLI avant tout code |
| Processus `claude` orphelins à la fermeture | Moyen | `stopSession` + arrêt de tous les processus sur `before-quit` |
| Lignes de `stdout` coupées en plusieurs morceaux | Moyen | tampon de ligne testé en T3 |

## Constats T1 (vrai flux, Claude Code 2.1.310)
- Entrée stdin, une ligne : `{"type":"user","message":{"role":"user","content":"..."}}`
- `session_id` présent sur **toutes** les lignes (même avant `system/init`) → on le lit dès la 1re ligne.
- Ordre : `system/hook_*` (hooks perso) → `system/init` → `system/status` → `stream_event` (`message_start`, `content_block_delta` + `text_delta`, …, `message_stop`) → `assistant` (message complet) → `rate_limit_event` → `result/success`.
- Le texte en direct = `stream_event` → `event.delta.type === "text_delta"` → `event.delta.text`.
- Fin de tour = ligne `type: "result"` (`result` = texte final, `is_error` en cas d'échec).
- `apiKeySource: "none"` : abonnement, pas de clé API. `total_cost_usd` est une estimation, pas une facture.

## Questions ouvertes
- Aucune bloquante.
