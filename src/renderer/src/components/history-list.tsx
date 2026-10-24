import type { HistoryProject } from '../../../shared/history';
import { ago } from '../usage-format';

interface Props {
  projects: HistoryProject[];
  now: number;
  /** `folder/id` de la session affichée, s'il y en a une. */
  openKey?: string;
  onOpen: (folder: string, id: string) => void;
  onRefresh: () => void;
}

/** Dernier dossier du vrai chemin (« mon-claude »), sinon le nom encodé du dossier. */
export function projectLabel(project: HistoryProject): string {
  return project.path?.split(/[\\/]/).filter(Boolean).at(-1) ?? project.folder;
}

export function HistoryList({ projects, now, openKey, onOpen, onRefresh }: Props) {
  return (
    <section className="history">
      <div className="history-head">
        <span>Historique</span>
        <button className="refresh" aria-label="Rafraîchir l'historique" onClick={onRefresh}>
          ↻
        </button>
      </div>
      {projects.map((p) => {
        const hasOpen = openKey?.startsWith(`${p.folder}/`);
        return (
          // <details> se replie tout seul ; on force l'ouverture seulement pour le projet de la session affichée.
          <details key={p.folder} open={hasOpen || undefined}>
            <summary title={p.path ?? p.folder}>
              {projectLabel(p)} <span className="muted">({p.sessions.length})</span>
            </summary>
            <ul>
              {p.sessions.map((s) => (
                <li
                  key={s.id}
                  className={openKey === `${p.folder}/${s.id}` ? 'active' : undefined}
                  onClick={() => onOpen(p.folder, s.id)}
                  title={s.title}
                >
                  <span className="sidebar-title">{s.title}</span>
                  <span className="muted history-date">{ago(s.lastAt, now)}</span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
