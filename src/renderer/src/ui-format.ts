import type { HistoryProject, HistorySession } from '../../shared/history';

/** Dernier dossier d'un chemin Windows ou POSIX (« mon-claude »), séparateur final ignoré. */
export function folderLabel(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

/** Minuscules et sans accents : « Été » → « ete ». */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Historique filtré par une recherche : un projet dont le nom correspond garde toutes ses sessions,
 * sinon on ne garde que les sessions dont le titre affiché correspond. Les projets vides disparaissent.
 */
export function filterHistory(
  projects: HistoryProject[],
  query: string,
  titleOf: (folder: string, session: HistorySession) => string = (_folder, session) => session.title,
): HistoryProject[] {
  const q = fold(query.trim());
  if (!q) return projects;
  return projects.flatMap((p) => {
    if (fold(p.path ? folderLabel(p.path) : p.folder).includes(q)) return [p];
    const sessions = p.sessions.filter((s) => fold(titleOf(p.folder, s)).includes(q));
    return sessions.length ? [{ ...p, sessions }] : [];
  });
}

/** Ctrl+B seul (sans Maj, Alt ni Windows) : replier ou déplier la barre latérale. */
export function isSidebarToggle(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>): boolean {
  return e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'b';
}

// Barre latérale repliée ou non, retenue entre deux lancements de l'app.
const COLLAPSED_KEY = 'mon-claude:sidebar-collapsed';

export function readCollapsed(storage: Pick<Storage, 'getItem'>): boolean {
  try {
    return storage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeCollapsed(storage: Pick<Storage, 'setItem'>, collapsed: boolean): void {
  try {
    storage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    // stockage indisponible : l'état ne sera pas retenu, sans gravité
  }
}
