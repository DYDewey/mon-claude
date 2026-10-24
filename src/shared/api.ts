import type { BridgeEvent } from './events';

// API exposée au renderer sous `window.claude` par le preload.
export interface ClaudeApi {
  startSession(cwd: string, opts?: { resumeId?: string }): Promise<string>;
  sendMessage(sessionId: string, text: string): void;
  stopSession(sessionId: string): void;
  /** Renvoie la fonction de désabonnement. */
  onEvent(cb: (event: BridgeEvent) => void): () => void;
}

export const IPC = {
  start: 'claude:start',
  send: 'claude:send',
  stop: 'claude:stop',
  event: 'claude:event',
} as const;
