import { useEffect, useRef } from 'react';
import type { SessionState } from '../state/sessions';
import { Markdown } from './message';
import { ToolLine } from './tool-line';

export function ChatView({ session }: { session: SessionState }) {
  const bottom = useRef<HTMLDivElement>(null);
  // Claude n'a encore rien écrit depuis le dernier message : on le dit, le démarrage prend ~35 s.
  const waiting = session.status === 'running' && session.items.at(-1)?.kind === 'user';

  // Accolades obligatoires : scrollIntoView renvoie une Promise dans Electron 45, et React
  // prendrait toute valeur renvoyée pour une fonction de nettoyage (plantage « destroy_ is not a function »).
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [session.items]);

  return (
    <div className="chat">
      {session.items.map((item, i) => {
        switch (item.kind) {
          case 'user':
            return <div key={i} className="msg msg-user">{item.text}</div>;
          case 'assistant':
            return (
              <div key={i} className="msg msg-claude">
                <Markdown text={item.text} />
              </div>
            );
          case 'tool':
            return <ToolLine key={i} name={item.name} input={item.input} />;
          case 'stopped':
            return <div key={i} className="msg muted">⏹ Réponse arrêtée</div>;
          case 'error':
            return <div key={i} className="msg msg-error">⚠️ {item.message}</div>;
        }
      })}
      {waiting && <div className="msg msg-claude muted">Claude démarre…</div>}
      <div ref={bottom} />
    </div>
  );
}
