import type { ReactNode } from 'react';
import type { Limits, SessionState } from '../state/sessions';
import { ContextBadge, UsageGauges } from './usage-gauges';

interface Props {
  sessions: SessionState[];
  activeId: string | null;
  limits?: Limits;
  onNew: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** Placé entre les sessions en cours et les jauges (l'historique). */
  children?: ReactNode;
}

export function Sidebar({ sessions, activeId, limits, onNew, onSelect, onClose, children }: Props) {
  return (
    <nav className="sidebar">
      <button onClick={onNew}>+ Nouvelle session</button>
      <ul>
        {sessions.map((s) => (
          <li
            key={s.id}
            className={s.id === activeId ? 'active' : undefined}
            onClick={() => onSelect(s.id)}
            title={s.cwd}
          >
            {/* ● = Claude répond ; ◌ = réponse arrivée pendant que la session était cachée. */}
            <span className="indicator">{s.status === 'running' ? '●' : s.unread ? '◌' : ''}</span>
            <span className="sidebar-title">{s.title}</span>
            <ContextBadge context={s.context} />
            <button
              className="close"
              aria-label="Fermer la session"
              onClick={(e) => {
                e.stopPropagation(); // sinon le clic sélectionne aussi la session
                onClose(s.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {children}
      <UsageGauges limits={limits} />
    </nav>
  );
}
