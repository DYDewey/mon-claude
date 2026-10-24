// Événements envoyés du main au renderer pour une session claude.
export type BridgeEvent =
  | { type: 'text-delta'; sessionId: string; text: string }
  | { type: 'tool-use'; sessionId: string; name: string; input: Record<string, unknown> }
  | { type: 'turn-end'; sessionId: string; result?: string; costUsd?: number }
  | { type: 'error'; sessionId: string; message: string }
  /** Commandes et skills disponibles (« / »), envoyés par claude au démarrage. */
  | { type: 'commands'; sessionId: string; names: string[] };
