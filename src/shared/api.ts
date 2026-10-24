import type { ChatItem } from './chat-item';
import type { BridgeEvent } from './events';
import type { HistoryProject } from './history';

// API exposée au renderer sous `window.claude` par le preload.
export interface ClaudeApi {
  startSession(cwd: string, opts?: { resumeId?: string }): Promise<string>;
  sendMessage(sessionId: string, text: string): void;
  /** Ouvre la boîte de dialogue Windows ; renvoie le dossier choisi, ou null si annulé. */
  pickFolder(): Promise<string | null>;
  /** Arrête la réponse en cours sans fermer la session. */
  interrupt(sessionId: string): void;
  stopSession(sessionId: string): void;
  /** Renvoie la fonction de désabonnement. */
  onEvent(cb: (event: BridgeEvent) => void): () => void;
  /** Anciennes sessions de ~/.claude/projects/, en lecture seule. */
  listHistory(): Promise<HistoryProject[]>;
  readHistory(folder: string, id: string): Promise<ChatItem[]>;
}

export const IPC = {
  start: 'claude:start',
  send: 'claude:send',
  interrupt: 'claude:interrupt',
  pickFolder: 'claude:pick-folder',
  stop: 'claude:stop',
  event: 'claude:event',
  historyList: 'history:list',
  historyRead: 'history:read',
} as const;
