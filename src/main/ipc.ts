import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { IPC } from '../shared/api';
import { createHistoryReader } from './history-reader';
import { SessionManager } from './session-manager';

export function registerClaudeIpc(): SessionManager {
  const manager = new SessionManager((event) => {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.event, event);
  });

  ipcMain.handle(IPC.start, (_e, cwd: unknown, resumeId: unknown) => {
    // Le renderer n'est pas digne de confiance : on vérifie ce qu'il envoie.
    if (typeof cwd !== 'string' || !existsSync(cwd)) throw new Error(`Dossier invalide : ${String(cwd)}`);
    if (resumeId !== undefined && typeof resumeId !== 'string') throw new Error('resumeId invalide');
    return manager.start(cwd, resumeId);
  });

  ipcMain.on(IPC.send, (_e, sessionId: unknown, text: unknown) => {
    if (typeof sessionId === 'string' && typeof text === 'string') manager.send(sessionId, text);
  });

  ipcMain.handle(IPC.pickFolder, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const options = { title: 'Dossier de travail de la session', properties: ['openDirectory' as const] };
    const res = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    return res.canceled ? null : (res.filePaths[0] ?? null);
  });

  ipcMain.on(IPC.interrupt,(_e, sessionId: unknown) => {
    if (typeof sessionId === 'string') manager.interrupt(sessionId);
  });

  ipcMain.on(IPC.stop,(_e, sessionId: unknown) => {
    if (typeof sessionId === 'string') manager.stop(sessionId);
  });

  return manager;
}

export function registerHistoryIpc(): void {
  const reader = createHistoryReader(join(homedir(), '.claude', 'projects'));

  ipcMain.handle(IPC.historyList, () => reader.listProjects());

  ipcMain.handle(IPC.historyRead, (_e, folder: unknown, id: unknown) => {
    if (typeof folder !== 'string' || typeof id !== 'string') throw new Error('Session invalide');
    return reader.readSession(folder, id); // vérifie aussi que le chemin reste dans le dossier
  });
}
