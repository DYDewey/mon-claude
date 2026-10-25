import { FolderKanban, FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { HistoryProject } from '../../../shared/history';
import { displayTitle, sessionKey, type OrganizeData } from '../../../shared/organize';
import { projectSessions } from '../../../shared/projects';
import { FavoriteButton } from './favorite-button';

interface Props {
  history: HistoryProject[];
  organize: OrganizeData;
  openKey?: string;
  onOpen: (folder: string, id: string) => void;
  onToggleFavorite: (key: string) => void;
  onNewProject: () => void;
  onNewSession: (folder: string) => void;
}

/** Section « Projets » : un clic déplie les sessions du projet ; le bouton « + » lance une session dans son dossier. */
export function ProjectsList({ history, organize, openKey, onOpen, onToggleFavorite, onNewProject, onNewSession }: Props) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const projects = Object.entries(organize.projects ?? {}).sort(([, a], [, b]) => a.name.localeCompare(b.name));

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <section className="projects">
      <div className="history-head">
        <span>Projets</span>
        <button className="btn-icon" aria-label="Nouveau projet" title="Nouveau projet" onClick={onNewProject}>
          <FolderPlus size={14} aria-hidden />
        </button>
      </div>
      {projects.length > 0 && (
        <ul>
          {projects.map(([id, project]) => {
            const sessions = projectSessions(history, project);
            // Comme l'historique : déplié d'office si la session affichée en fait partie.
            const open =
              expanded.has(id) || sessions.some((e) => openKey === sessionKey(e.project.folder, e.session.id));
            const newLabel = `Nouvelle session dans « ${project.name} »`;
            return (
              <li key={id} className="project-item">
                <div className="project-row" onClick={() => toggle(id)} title={project.folder}>
                  <FolderKanban size={14} aria-hidden />
                  <span className="sidebar-title">{project.name}</span>
                  <span className="muted">({sessions.length})</span>
                  <button
                    className="btn-icon project-new"
                    aria-label={newLabel}
                    title={newLabel}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewSession(project.folder);
                    }}
                  >
                    <Plus size={14} aria-hidden />
                  </button>
                </div>
                {open && (
                  <ul className="project-sessions">
                    {sessions.map(({ project: entry, session }) => {
                      const key = sessionKey(entry.folder, session.id);
                      const title = displayTitle(session, organize.sessions[key]);
                      return (
                        <li
                          key={key}
                          className={openKey === key ? 'active' : undefined}
                          onClick={() => onOpen(entry.folder, session.id)}
                          title={title}
                        >
                          <span className="sidebar-title">{title}</span>
                          <FavoriteButton
                            on={!!organize.sessions[key]?.favorite}
                            onToggle={() => onToggleFavorite(key)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
