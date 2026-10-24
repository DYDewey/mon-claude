import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC, type ClaudeApi } from '../shared/api';
import type { BridgeEvent } from '../shared/events';

const api: ClaudeApi = {
  startSession: (cwd, opts) => ipcRenderer.invoke(IPC.start, cwd, opts?.resumeId),
  sendMessage: (sessionId, text) => ipcRenderer.send(IPC.send, sessionId, text),
  stopSession: (sessionId) => ipcRenderer.send(IPC.stop, sessionId),
  onEvent: (cb) => {
    const listener = (_e: IpcRendererEvent, event: BridgeEvent) => cb(event);
    ipcRenderer.on(IPC.event, listener);
    return () => ipcRenderer.removeListener(IPC.event, listener);
  },
};

contextBridge.exposeInMainWorld('claude', api);
