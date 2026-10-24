import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { registerClaudeIpc, registerHandoffIpc, registerHistoryIpc } from './ipc';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    title: 'Mon-Claude',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // En dev, electron-vite fournit l'URL du serveur Vite ; en build, on charge le fichier.
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  const sessions = registerClaudeIpc();
  registerHistoryIpc();
  registerHandoffIpc();
  // Aucun processus claude ne doit survivre à l'app.
  app.on('before-quit', () => sessions.stopAll());
  createWindow();
});

app.on('window-all-closed', () => app.quit());
