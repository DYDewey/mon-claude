import type { SessionState } from '../state/sessions';

interface Props {
  sessions: SessionState[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function Sidebar({ sessions, activeId, onNew, onSelect, onClose }: Props) {
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
    </nav>
  );
}
