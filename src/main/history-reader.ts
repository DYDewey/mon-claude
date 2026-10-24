import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { ChatItem } from '../shared/chat-item';
import type { HistoryProject, HistorySession } from '../shared/history';
import { parseSession } from './history-parser';

// Lit l'historique de Claude Code. LECTURE SEULE : uniquement readdir, stat et readFile,
// jamais d'écriture ni de suppression dans ces dossiers.

// Noms de dossier et d'id autorisés : pas de séparateur, pas de « .. ».
const SAFE_NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

interface Cached {
  mtimeMs: number;
  session: HistorySession;
  cwd?: string;
}

async function readLines(file: string): Promise<string[]> {
  return (await readFile(file, 'utf8')).split('\n');
}

export function createHistoryReader(root: string) {
  const cache = new Map<string, Cached>();

  async function readMeta(file: string, id: string): Promise<Cached> {
    const { mtimeMs } = await stat(file);
    const hit = cache.get(file);
    if (hit && hit.mtimeMs === mtimeMs) return hit;
    const parsed = parseSession(await readLines(file));
    const entry: Cached = {
      mtimeMs,
      cwd: parsed.cwd,
      session: { id, title: parsed.title, lastAt: parsed.lastAt ?? mtimeMs, messageCount: parsed.messageCount },
    };
    cache.set(file, entry);
    return entry;
  }

  async function listProjects(): Promise<HistoryProject[]> {
    let folders;
    try {
      folders = await readdir(root, { withFileTypes: true });
    } catch {
      return []; // pas encore d'historique
    }
    const projects: HistoryProject[] = [];
    for (const dir of folders) {
      if (!dir.isDirectory()) continue;
      const entries = await readdir(join(root, dir.name), { withFileTypes: true });
      const metas: Cached[] = [];
      for (const f of entries) {
        if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
        metas.push(await readMeta(join(root, dir.name, f.name), f.name.slice(0, -'.jsonl'.length)));
      }
      if (metas.length === 0) continue;
      metas.sort((a, b) => b.session.lastAt - a.session.lastAt);
      projects.push({
        folder: dir.name,
        path: metas.find((m) => m.cwd)?.cwd,
        sessions: metas.map((m) => m.session),
      });
    }
    return projects.sort((a, b) => b.sessions[0].lastAt - a.sessions[0].lastAt);
  }

  async function readSession(folder: string, id: string): Promise<ChatItem[]> {
    if (!SAFE_NAME.test(folder) || !SAFE_NAME.test(id)) throw new Error('Chemin de session invalide');
    const base = resolve(root);
    const file = resolve(base, folder, `${id}.jsonl`);
    if (!file.startsWith(base + sep)) throw new Error('Chemin de session invalide');
    return parseSession(await readLines(file)).items;
  }

  return { listProjects, readSession };
}
