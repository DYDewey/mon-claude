import { RotateCw, Search } from 'lucide-react';
import { useState } from 'react';
import type { HistoryProject, HistorySession } from '../../../shared/history';
import { displayTitle, emptyOrganize, sessionKey, type OrganizeData } from '../../../shared/organize';
import { filterHistory, folderLabel } from '../ui-format';
import { ago } from '../usage-format';
import { FavoriteButton } from './favorite-button';
import { RenameButton, RenameField } from './rename-field';

interface Props {
  projects: HistoryProject[];
  now: number;
  /** `folder/id` de la session affichée, s'il y en a une. */
  openKey?: string;
  onOpen: (folder: string, id: string) => void;
  onRefresh: () => void;
  /** Favoris et noms personnalisés (vide par défaut). */
  organize?: OrganizeData;
  onToggleFavorite?: (key: string) => void;
  /** Nom vide : retour au titre d'origine. */
  onRename?: (key: string, title: string) => void;
  /** Pour les tests : recherche déjà saisie. */
  initialQuery?: string;
}

/** Dernier dossier du vrai chemin (« mon-claude »), sinon le nom encodé du dossier. */
export function projectLabel(project: HistoryProject): string {
  return project.path ? folderLabel(project.path) : project.folder;
}

const NO_ORGANIZE = emptyOrganize();

export function HistoryList({
  projects,
  now,
  openKey,
  onOpen,
  onRefresh,
  organize = NO_ORGANIZE,
  onToggleFavorite = () => {},
  onRename = () => {},
  initialQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  /** Clé de la session en cours de renommage. */
  const [editing, setEditing] = useState<string | null>(null);
  const titleOf = (folder: string, s: HistorySession) => displayTitle(s, organize.sessions[sessionKey(folder, s.id)]);
  const searching = query.trim() !== '';
  const shown = filterHistory(projects, query, titleOf);
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
              {p.sessions.map((s) => {
                const key = sessionKey(p.folder, s.id);
                const title = titleOf(p.folder, s);
                return (
                  <li
                    key={s.id}
                    className={openKey === key ? 'active' : undefined}
                    onClick={() => onOpen(p.folder, s.id)}
                    title={title}
                  >
                    {editing === key ? (
                      <RenameField
                        initial={title}
                        onSave={(name) => {
                          setEditing(null);
                          onRename(key, name);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <>
                        <span className="sidebar-title">{title}</span>
                        <span className="muted history-date">{ago(s.lastAt, now)}</span>
                        <RenameButton onClick={() => setEditing(key)} />
                        <FavoriteButton on={!!organize.sessions[key]?.favorite} onToggle={() => onToggleFavorite(key)} />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
