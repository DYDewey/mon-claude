// Événements envoyés du main au renderer pour une session claude.
export type BridgeEvent =
  | { type: 'text-delta'; sessionId: string; text: string }
  | { type: 'turn-end'; sessionId: string; result?: string; costUsd?: number }
  | { type: 'error'; sessionId: string; message: string };
