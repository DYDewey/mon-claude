import { useState, type KeyboardEvent } from 'react';

interface Props {
  running: boolean;
  onSend: (text: string) => void;
}

export function Composer({ running, onSend }: Props) {
  const [text, setText] = useState('');

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || running) return;
    onSend(trimmed);
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée envoie, Maj+Entrée fait un saut de ligne.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={running}
        placeholder={running ? 'Claude répond…' : 'Écris ton message (Entrée pour envoyer)'}
        rows={3}
        autoFocus
      />
      <button onClick={submit} disabled={running || !text.trim()}>
        Envoyer
      </button>
    </div>
  );
}
