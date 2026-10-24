import type { ChatItem } from '../../../shared/chat-item';
import { ChatView } from './chat-view';

interface Props {
  title: string;
  path?: string;
  /** Absent tant que la session est en cours de lecture. */
  items?: ChatItem[];
  error?: string;
}

// Ancienne session relue depuis ~/.claude/projects/ : même affichage que le chat, sans zone de saisie.
export function HistoryView({ title, path, items, error }: Props) {
  return (
    <main className="session">
      <header className="topbar">
        <span className="topbar-title">
          {title}
          {path && <span className="muted"> · {path}</span>}
        </span>
        <span className="readonly">📖 Lecture seule</span>
      </header>
      {error ? (
        <div className="chat">
          <div className="msg msg-error">⚠️ {error}</div>
        </div>
      ) : items ? (
        <ChatView items={items} running={false} />
      ) : (
        <div className="chat">
          <div className="msg muted">Chargement…</div>
        </div>
      )}
    </main>
  );
}
