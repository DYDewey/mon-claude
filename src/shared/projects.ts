import type { HistoryProject } from './history';
import type { FavoriteEntry, OrganizeData } from './organize';

// Projets : un dossier de travail + des instructions et des fichiers envoyés à chaque session lancée dedans.

export interface Project {
  name: string;
  folder: string;
  instructions?: string;
  files?: string[];
}

/** La ligne de commande Windows est limitée à 32 767 caractères : on garde de la marge. */
export const MAX_INSTRUCTIONS = 10_000;
export const MAX_FILES = 50;

const ID = /^p_[a-z0-9]+$/;

export function newProjectId(): string {
  return `p_${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;
}

/** Même dossier sous Windows : casse, `/` et `\` finaux ignorés. */
export function sameFolder(a: string, b: string): boolean {
  const norm = (path: string) => path.replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
  return norm(a) === norm(b);
}

function folderName(folder: string): string {
  return folder.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || folder;
}

/** Remet un projet en forme : nom vide → nom du dossier, champs vides retirés, longueurs plafonnées. */
function clean(project: Project): Project {
  const instructions = project.instructions?.slice(0, MAX_INSTRUCTIONS);
  const files = [...new Set(project.files ?? [])].slice(0, MAX_FILES);
  return {
    name: project.name.trim() || folderName(project.folder),
    folder: project.folder,
    ...(instructions?.trim() && { instructions }),
    ...(files.length > 0 && { files }),
  };
}

export function projectForCwd(data: OrganizeData, cwd: string): { id: string; project: Project } | null {
  const found = Object.entries(data.projects ?? {}).find(([, project]) => sameFolder(project.folder, cwd));
  return found ? { id: found[0], project: found[1] } : null;
}

/** Ajoute un projet sur `folder`, sauf s'il en existe déjà un (la donnée revient alors inchangée). */
export function addProject(data: OrganizeData, id: string, folder: string): OrganizeData {
  if (projectForCwd(data, folder)) return data;
  return { ...data, projects: { ...data.projects, [id]: clean({ name: '', folder }) } };
}

export function updateProject(
  data: OrganizeData,
  id: string,
  patch: Partial<Omit<Project, 'folder'>>,
): OrganizeData {
  const current = data.projects?.[id];
  if (!current) return data;
  return { ...data, projects: { ...data.projects, [id]: clean({ ...current, ...patch }) } };
}

/** Retire seulement la fiche : sessions et fichiers ne sont pas touchés. */
export function removeProject(data: OrganizeData, id: string): OrganizeData {
  const projects = { ...data.projects };
  delete projects[id];
  return { ...data, projects };
}

/** Sessions de l'historique lancées dans le dossier du projet, de la plus récente à la plus ancienne. */
export function projectSessions(history: HistoryProject[], project: Project): FavoriteEntry[] {
  return history
    .filter((entry) => entry.path !== undefined && sameFolder(entry.path, project.folder))
    .flatMap((entry) => entry.sessions.map((session) => ({ project: entry, session })))
    .sort((a, b) => b.session.lastAt - a.session.lastAt);
}

/** Texte ajouté au prompt système (`--append-system-prompt`) ; null s'il n'y a rien à envoyer. */
export function buildProjectPrompt(project: Project, exists: (path: string) => boolean): string | null {
  const instructions = project.instructions?.trim();
  const files = (project.files ?? []).filter(exists);
  const parts: string[] = [];
  if (instructions) parts.push(`Instructions du projet « ${project.name} » :\n${instructions}`);
  if (files.length > 0) {
    parts.push(
      `Fichiers de référence du projet « ${project.name} » (lis-les avec Read si utile) :\n` +
        files.map((file) => `- ${file}`).join('\n'),
    );
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
}

/** Ce que main ajoute au prompt système d'une session lancée dans `cwd`. */
export function promptForCwd(data: OrganizeData, cwd: string, exists: (path: string) => boolean): string | null {
  const found = projectForCwd(data, cwd);
  return found ? buildProjectPrompt(found.project, exists) : null;
}

/** Valide le champ `projects` d'organize.json : entrées invalides ignorées. */
export function parseProjects(raw: unknown): Record<string, Project> {
  const projects: Record<string, Project> = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return projects;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    // L'expression régulière écarte aussi « __proto__ ».
    if (!ID.test(id) || typeof value !== 'object' || value === null) continue;
    const { name, folder, instructions, files } = value as Record<string, unknown>;
    if (typeof name !== 'string' || typeof folder !== 'string' || !folder) continue;
    projects[id] = clean({
      name,
      folder,
      ...(typeof instructions === 'string' && { instructions }),
      ...(Array.isArray(files) && { files: files.filter((f): f is string => typeof f === 'string') }),
    });
  }
  return projects;
}
