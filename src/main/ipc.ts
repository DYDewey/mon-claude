import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { IPC } from '../shared/api';
import { isModelChoice } from '../shared/model';
import { emptyOrganize, parseOrganize, type OrganizeData } from '../shared/organize';
import { promptForCwd } from '../shared/projects';
import { savePastedImage } from './attachment-store';
import { saveHandoff } from './handoff-store';
import { createHistoryReader } from './history-reader';
import { loadOrganize, saveOrganize } from './organize-store';
import { SessionManager } from './session-manager';

/** Copie de organize.json tenue par main : les instructions des projets y sont lues à chaque lancement de claude. */
let organize: OrganizeData = emptyOrganize();

export function registerClaudeIpc(): SessionManager {
  const manager = new SessionManager(
    (event) => {
      for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.event, event);
    },
    { promptFor: (cwd) => promptForCwd(organize, cwd, existsSync) },
  );

  ipcMain.handle(IPC.start, (_e, cwd: unknown, resumeId: unknown, model: unknown) => {
    // Le renderer n'est pas digne de confiance : on vérifie ce qu'il envoie.
    if (typeof cwd !== 'string' || !existsSync(cwd)) throw new Error(`Dossier invalide : ${String(cwd)}`);
    if (resumeId !== undefined && typeof resumeId !== 'string') throw new Error('resumeId invalide');
    if (model !== undefined && !isModelChoice(model)) throw new Error('Modèle invalide');
    return manager.start(cwd, resumeId, model);
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

  ipcMain.handle(IPC.pickFiles, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const options = { title: 'Joindre des fichiers', properties: ['openFile' as const, 'multiSelections' as const] };
    const res = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    return res.canceled ? [] : res.filePaths;
  });

  ipcMain.handle(IPC.savePasted, (_e, bytes: unknown, ext: unknown) => {
    if (!(bytes instanceof Uint8Array) || typeof ext !== 'string') throw new Error('Image invalide');
    return savePastedImage(join(app.getPath('userData'), 'attachments'), bytes, ext, new Date());
  });

  ipcMain.on(IPC.interrupt,(_e, sessionId: unknown) => {
    if (typeof sessionId === 'string') manager.interrupt(sessionId);
  });

  ipcMain.on(IPC.stop,(_e, sessionId: unknown) => {
    if (typeof sessionId === 'string') manager.stop(sessionId);
  });

  ipcMain.handle(IPC.setModel, (_e, sessionId: unknown, model: unknown) => {
    if (typeof sessionId !== 'string') throw new Error('sessionId invalide');
    if (model !== undefined && !isModelChoice(model)) throw new Error('Modèle invalide');
    manager.restart(sessionId, model);
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

export function registerHandoffIpc(): void {
  ipcMain.handle(IPC.handoffSave, (_e, text: unknown, sessionId: unknown) => {
    if (typeof text !== 'string' || typeof sessionId !== 'string') throw new Error('Passation invalide');
    return saveHandoff(join(app.getPath('userData'), 'handoffs'), text, sessionId, new Date());
  });
}

export function registerOrganizeIpc(): void {
  const dir = app.getPath('userData');
  let changed = false;
  // Lecture au démarrage, sans écraser un enregistrement arrivé entre-temps.
  void loadOrganize(dir).then((data) => {
    if (!changed) organize = data;
  });
  ipcMain.handle(IPC.organizeGet, () => loadOrganize(dir));
  ipcMain.handle(IPC.organizeSet, (_e, data: unknown) => {
    // Repassée par parseOrganize : seuls les champs connus et bien typés sont écrits.
    const clean = parseOrganize(JSON.stringify(data ?? null));
    if (!clean) throw new Error('Données de rangement invalides');
    changed = true;
    organize = clean;
    return saveOrganize(dir, clean);
  });
}
