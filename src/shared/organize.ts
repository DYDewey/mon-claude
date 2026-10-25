import type { HistoryProject, HistorySession } from './history';

// Favoris et noms personnalisés, rangés par l'app dans organize.json (jamais dans les .jsonl de Claude Code).

export interface SessionMeta {
  favorite?: true;
  title?: string;
}

export interface OrganizeData {
  version: 1;
  /** Clé : `sessionKey(dossier, id)`. Une entrée vide est retirée. */
  sessions: Record<string, SessionMeta>;
}

export function sessionKey(folder: string, id: string): string {
  return `${folder}/${id}`;
}

export function emptyOrganize(): OrganizeData {
  return { version: 1, sessions: {} };
}

/** Remplace l'entrée `key` ; si elle n'a plus aucun champ, elle disparaît. */
function withMeta(data: OrganizeData, key: string, meta: SessionMeta): OrganizeData {
  const sessions = { ...data.sessions };
  if (meta.favorite || meta.title) sessions[key] = meta;
  else delete sessions[key];
  return { ...data, sessions };
}

export function toggleFavorite(data: OrganizeData, key: string): OrganizeData {
  const { favorite, ...rest } = data.sessions[key] ?? {};
  return withMeta(data, key, favorite ? rest : { favorite: true, ...rest });
}

/** Nom vide ou fait d'espaces : on revient au titre d'origine. */
export function renameSession(data: OrganizeData, key: string, title: string): OrganizeData {
  const name = title.trim();
  const favorite = data.sessions[key]?.favorite;
  return withMeta(data, key, { ...(favorite && { favorite }), ...(name && { title: name }) });
}

export function displayTitle(session: Pick<HistorySession, 'title'>, meta: SessionMeta | undefined): string {
  return meta?.title ?? session.title;
}

export interface FavoriteEntry {
  project: HistoryProject;
  session: HistorySession;
}

/** Favoris encore présents dans l'historique, du plus récent au plus ancien. */
export function favoriteSessions(projects: HistoryProject[], data: OrganizeData): FavoriteEntry[] {
  return projects
    .flatMap((project) =>
      project.sessions
        .filter((session) => data.sessions[sessionKey(project.folder, session.id)]?.favorite)
        .map((session) => ({ project, session })),
    )
    .sort((a, b) => b.session.lastAt - a.session.lastAt);
}

/** Relit organize.json ; null s'il est illisible ou d'une version inconnue. Les champs inconnus sont ignorés. */
export function parseOrganize(text: string): OrganizeData | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(raw) || raw.version !== 1 || !isObject(raw.sessions)) return null;
  const data = emptyOrganize();
  for (const [key, value] of Object.entries(raw.sessions)) {
    if (!isObject(value)) continue;
    const meta: SessionMeta = {};
    if (value.favorite === true) meta.favorite = true;
    if (typeof value.title === 'string' && value.title.trim()) meta.title = value.title.trim();
    if (meta.favorite || meta.title) data.sessions[key] = meta;
  }
  return data;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
