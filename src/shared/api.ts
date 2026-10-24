import type { ChatItem } from './chat-item';
import type { BridgeEvent } from './events';
import type { HistoryProject } from './history';
import type { ModelChoice } from './model';

// API exposée au renderer sous `window.claude` par le preload.
export interface ClaudeApi {
  startSession(cwd: string, opts?: { resumeId?: string; model?: ModelChoice }): Promise<string>;
  sendMessage(sessionId: string, text: string): void;
  /** Ouvre la boîte de dialogue Windows ; renvoie le dossier choisi, ou null si annulé. */
  pickFolder(): Promise<string | null>;
  /** Boîte de dialogue Windows pour joindre des fichiers ; renvoie leurs chemins (vide si annulé). */
  pickFiles(): Promise<string[]>;
  /** Chemin d'un fichier glissé-déposé ('' s'il ne vient pas du disque). */
  pathForFile(file: File): string;
  /** Enregistre une image collée dans %APPDATA%/mon-claude/attachments/ ; renvoie son chemin. */
  savePastedImage(bytes: Uint8Array, ext: string): Promise<string>;
  /** Arrête la réponse en cours sans fermer la session. */
  interrupt(sessionId: string): void;
  stopSession(sessionId: string): void;
  /** Relance la session avec un autre modèle (undefined : « Par défaut ») ; la conversation continue. */
  setModel(sessionId: string, model: ModelChoice | undefined): Promise<void>;
  /** Renvoie la fonction de désabonnement. */
  onEvent(cb: (event: BridgeEvent) => void): () => void;
  /** Anciennes sessions de ~/.claude/projects/, en lecture seule. */
  listHistory(): Promise<HistoryProject[]>;
  readHistory(folder: string, id: string): Promise<ChatItem[]>;
  /** Enregistre la passation relue dans %APPDATA%/mon-claude/handoffs/ ; renvoie le chemin du fichier. */
  saveHandoff(text: string, sessionId: string): Promise<string>;
}

export const IPC = {
  start: 'claude:start',
  send: 'claude:send',
  interrupt: 'claude:interrupt',
  pickFolder: 'claude:pick-folder',
  pickFiles: 'files:pick',
  savePasted: 'files:save-pasted',
  stop: 'claude:stop',
  setModel: 'session:set-model',
  event: 'claude:event',
  historyList: 'history:list',
  historyRead: 'history:read',
  handoffSave: 'handoff:save',
} as const;
