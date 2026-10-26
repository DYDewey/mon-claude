import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { matchSession, searchableTexts, searchTerms, snippet, type SearchHit, type SearchText } from '../shared/search';
import { parseSession } from './history-parser';

// Recherche dans le contenu des .jsonl de ~/.claude/projects/. LECTURE SEULE : readdir, stat et readFile.
// Le texte de chaque session reste en mémoire, relu seulement si sa taille ou sa date a changé.

const MAX_HITS = 50;

interface Entry {
  size: number;
  mtimeMs: number;
  title: string;
  path?: string;
  lastAt: number;
  texts: SearchText[];
}

type Read = (file: string) => Promise<string>;

export function createSearchIndex(root: string, read: Read = (file) => readFile(file, 'utf8')) {
  const cache = new Map<string, Entry>();

  /** Session à jour depuis le cache ou le disque ; null si illisible. */
  async function load(file: string): Promise<Entry | null> {
    try {
      const { size, mtimeMs } = await stat(file);
      const hit = cache.get(file);
      if (hit && hit.size === size && hit.mtimeMs === mtimeMs) return hit;
      const parsed = parseSession((await read(file)).split('\n'));
      const entry: Entry = {
        size,
        mtimeMs,
        title: parsed.title,
        path: parsed.cwd,
        lastAt: parsed.lastAt ?? mtimeMs,
        texts: searchableTexts(parsed.items),
      };
      cache.set(file, entry);
      return entry;
    } catch {
      return null; // illisible : on passe aux autres
    }
  }

  /** Les .jsonl directement sous chaque dossier de projet. */
  async function sessionFiles(): Promise<{ folder: string; id: string; file: string }[]> {
    let folders;
    try {
      folders = await readdir(root, { withFileTypes: true });
    } catch {
      return []; // pas encore d'historique
    }
    const lists = await Promise.all(
      folders
        .filter((d) => d.isDirectory())
        .map(async (d) => {
          const entries = await readdir(join(root, d.name), { withFileTypes: true }).catch(() => []);
          return entries
            .filter((f) => f.isFile() && f.name.endsWith('.jsonl'))
            .map((f) => ({ folder: d.name, id: f.name.slice(0, -'.jsonl'.length), file: join(root, d.name, f.name) }));
        }),
    );
    return lists.flat();
  }

  async function search(query: string): Promise<SearchHit[]> {
    const terms = searchTerms(query);
    if (terms.length === 0) return [];
    const files = await sessionFiles();
    const entries = await Promise.all(files.map((f) => load(f.file)));
    const hits: SearchHit[] = [];
    files.forEach(({ folder, id }, i) => {
      const entry = entries[i];
      const found = entry && matchSession(entry.texts, terms);
      if (!entry || !found) return;
      const text = entry.texts.find((t) => t.index === found.first)!.text;
      hits.push({
        folder,
        id,
        title: entry.title,
        path: entry.path,
        lastAt: entry.lastAt,
        count: found.count,
        focusIndex: found.first,
        snippet: snippet(text, found.term),
      });
    });
    return hits.sort((a, b) => b.lastAt - a.lastAt).slice(0, MAX_HITS);
  }

  return { search };
}
