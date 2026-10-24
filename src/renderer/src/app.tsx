import { useEffect, useReducer } from 'react';
import { ChatView } from './components/chat-view';
import { Composer } from './components/composer';
import { Sidebar } from './components/sidebar';
import { initialState, sessionsReducer, type ChatState } from './state/sessions';

const COMMANDS_KEY = 'commands';

function withSavedCommands(state: ChatState): ChatState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(COMMANDS_KEY) ?? '[]');
    return Array.isArray(saved) ? { ...state, commands: saved.filter((c) => typeof c === 'string') } : state;
  } catch {
    return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(sessionsReducer, initialState, withSavedCommands);
  const active = state.sessions.find((s) => s.id === state.activeId) ?? null;

  // Un seul abonnement pour toute l'app : chaque événement de claude devient une action du reducer.
  useEffect(() => window.claude.onEvent(dispatch), []);

  // claude n'envoie la liste des commandes qu'à sa 1re réponse : on garde la dernière pour les sessions neuves.
  useEffect(() => {
    try {
      if (state.commands.length) localStorage.setItem(COMMANDS_KEY, JSON.stringify(state.commands));
    } catch {
      // stockage indisponible : la liste reviendra à la prochaine réponse de claude
    }
  }, [state.commands]);

  async function newSession() {
    const cwd = await window.claude.pickFolder();
    if (!cwd) return;
    const sessionId = await window.claude.startSession(cwd);
    dispatch({ type: 'session-opened', sessionId, cwd });
  }

  function close(sessionId: string) {
    window.claude.stopSession(sessionId);
    dispatch({ type: 'session-closed', sessionId });
  }

  function send(text: string) {
    if (!active) return;
    dispatch({ type: 'user-sent', sessionId: active.id, text });
    window.claude.sendMessage(active.id, text);
  }

  function stop() {
    if (!active) return;
    dispatch({ type: 'user-interrupted', sessionId: active.id });
    window.claude.interrupt(active.id);
  }

  return (
    <div className="app">
      <Sidebar
        sessions={state.sessions}
        activeId={state.activeId}
        onNew={newSession}
        onSelect={(sessionId) => dispatch({ type: 'select', sessionId })}
        onClose={close}
      />
      {active ? (
        <main className="session">
          <header className="topbar">
            <span className="topbar-title">
              {active.title} · <span className="muted">{active.cwd}</span>
            </span>
          </header>
          <ChatView session={active} />
          <Composer running={active.status === 'running'} onSend={send} onStop={stop} commands={state.commands} />
        </main>
      ) : (
        <main className="empty">Clique sur « + Nouvelle session » et choisis un dossier de travail.</main>
      )}
    </div>
  );
}
