import { RotateCw, Search } from 'lucide-react';
import { useState } from 'react';
import type { HistoryProject } from '../../../shared/history';
import { filterHistory, folderLabel } from '../ui-format';
import { ago } from '../usage-format';

interface Props {
  projects: HistoryProject[];
  now: number;
  /** `folder/id` de la session affichée, s'il y en a une. */
  openKey?: string;
  onOpen: (folder: string, id: string) => void;
  onRefresh: () => void;
  /** Pour les tests : recherche déjà saisie. */
  initialQuery?: string;
}

/** Dernier dossier du vrai chemin (« mon-claude »), sinon le nom encodé du dossier. */
export function projectLabel(project: HistoryProject): string {
  return project.path ? folderLabel(project.path) : project.folder;
}

export function HistoryList({ projects, now, openKey, onOpen, onRefresh, initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const searching = query.trim() !== '';
  const shown = filterHistory(projects, query);
  return (
    <section className="history">
      <div className="history-head">
        <span>Historique</span>
        <button className="btn-icon" aria-label="Rafraîchir l'historique" title="Rafraîchir l'historique" onClick={onRefresh}>
          <RotateCw size={14} aria-hidden />
        </button>
      </div>
      <label className="search">
        <Search size={14} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          aria-label="Rechercher dans l'historique"
        />
      </label>
      {searching && shown.length === 0 && <p className="muted no-result">Aucun résultat</p>}
      {shown.map((p) => {
        const hasOpen = searching || openKey?.startsWith(`${p.folder}/`);
        return (
          // <details> se replie tout seul ; on force l'ouverture pour le projet de la session affichée et pendant une recherche.
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
