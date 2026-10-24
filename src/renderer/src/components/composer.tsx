import { useState, type KeyboardEvent } from 'react';
import { matchCommands, SlashMenu } from './slash-menu';

interface Props {
  running: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Noms des commandes et skills proposés après « / ». */
  commands: string[];
  /** Prochain message proposé par claude : affiché en gris, Tab le recopie. */
  suggestion?: string;
}

export function Composer({ running, onSend, onStop, commands, suggestion }: Props) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(0);
  const [menuClosed, setMenuClosed] = useState(false);
  const matches = menuClosed ? [] : matchCommands(text, commands);

  function change(value: string) {
    setText(value);
    setSelected(0);
    setMenuClosed(false);
  }

  function pick(name: string) {
    change(`/${name} `);
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || running) return;
    onSend(trimmed);
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab' && !text && suggestion) {
      e.preventDefault();
      change(suggestion);
      return;
    }
    if (matches.length > 0) {
      const move = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (move) {
        e.preventDefault();
        setSelected((selected + move + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Escape') {
        setMenuClosed(true);
        return;
      }
      // Tab ou Entrée complète le nom ; Entrée sur un nom déjà complet envoie directement.
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && text.slice(1) !== matches[selected])) {
        e.preventDefault();
        pick(matches[selected]);
        return;
      }
    }
    // Entrée envoie, Maj+Entrée fait un saut de ligne.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      {matches.length > 0 && <SlashMenu items={matches} selected={selected} onPick={pick} />}
      <textarea
        value={text}
        onChange={(e) => change(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={running}
        placeholder={
          running ? 'Claude répond…' : suggestion ? `${suggestion}   (Tab pour reprendre)` : 'Écris ton message (Entrée pour envoyer)'
        }
        rows={3}
        autoFocus
      />
      {running ? (
        <button onClick={onStop}>Stop</button>
      ) : (
        <button onClick={submit} disabled={!text.trim()}>
          Envoyer
        </button>
      )}
    </div>
  );
}
