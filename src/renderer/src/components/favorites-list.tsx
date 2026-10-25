import type { HistoryProject } from '../../../shared/history';
import { displayTitle, favoriteSessions, sessionKey, type OrganizeData } from '../../../shared/organize';
import { FavoriteButton } from './favorite-button';
import { projectLabel } from './history-list';

interface Props {
  projects: HistoryProject[];
  organize: OrganizeData;
  openKey?: string;
  onOpen: (folder: string, id: string) => void;
  onToggleFavorite: (key: string) => void;
}

/** Section « Favoris » : liste plate, plus récente d'abord ; rien s'il n'y a aucun favori. */
export function FavoritesList({ projects, organize, openKey, onOpen, onToggleFavorite }: Props) {
  const favorites = favoriteSessions(projects, organize);
  if (favorites.length === 0) return null;
  return (
    <section className="favorites">
      <div className="sidebar-section">Favoris</div>
      <ul>
        {favorites.map(({ project, session }) => {
          const key = sessionKey(project.folder, session.id);
          const title = displayTitle(session, organize.sessions[key]);
          return (
            <li
              key={key}
              className={openKey === key ? 'active' : undefined}
              onClick={() => onOpen(project.folder, session.id)}
              title={title}
            >
              <span className="sidebar-title">{title}</span>
              <span className="muted favorite-project">{projectLabel(project)}</span>
              <FavoriteButton on onToggle={() => onToggleFavorite(key)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
