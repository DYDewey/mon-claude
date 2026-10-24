import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron';
import { IPC, type ClaudeApi } from '../shared/api';
import type { BridgeEvent } from '../shared/events';

const api: ClaudeApi = {
  startSession: (cwd, opts) => ipcRenderer.invoke(IPC.start, cwd, opts?.resumeId, opts?.model),
  sendMessage: (sessionId, text) => ipcRenderer.send(IPC.send, sessionId, text),
  pickFolder: () => ipcRenderer.invoke(IPC.pickFolder),
  pickFiles: () => ipcRenderer.invoke(IPC.pickFiles),
  // File.path n'existe plus dans Electron récent : webUtils le remplace.
  pathForFile: (file) => webUtils.getPathForFile(file),
  interrupt: (sessionId) => ipcRenderer.send(IPC.interrupt, sessionId),
  stopSession: (sessionId) => ipcRenderer.send(IPC.stop, sessionId),
  setModel: (sessionId, model) => ipcRenderer.invoke(IPC.setModel, sessionId, model),
  onEvent: (cb) => {
    const listener = (_e: IpcRendererEvent, event: BridgeEvent) => cb(event);
    ipcRenderer.on(IPC.event, listener);
    return () => ipcRenderer.removeListener(IPC.event, listener);
  },
  listHistory: () => ipcRenderer.invoke(IPC.historyList),
  readHistory: (folder, id) => ipcRenderer.invoke(IPC.historyRead, folder, id),
  saveHandoff: (text, sessionId) => ipcRenderer.invoke(IPC.handoffSave, text, sessionId),
};

contextBridge.exposeInMainWorld('claude', api);
