import type { HistoryProject } from '../../shared/history';

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
 * sinon on ne garde que les sessions dont le titre correspond. Les projets vides disparaissent.
 */
export function filterHistory(projects: HistoryProject[], query: string): HistoryProject[] {
  const q = fold(query.trim());
  if (!q) return projects;
  return projects.flatMap((p) => {
    if (fold(p.path ? folderLabel(p.path) : p.folder).includes(q)) return [p];
    const sessions = p.sessions.filter((s) => fold(s.title).includes(q));
    return sessions.length ? [{ ...p, sessions }] : [];
  });
}
