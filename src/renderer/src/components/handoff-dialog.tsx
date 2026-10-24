import { useState } from 'react';

/** Relecture de la passation avant d'ouvrir une session neuve qui ne recevra que ce texte. */
export function HandoffDialog({
  initialText,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  initialText: string;
  /** Enregistrement et lancement en cours. */
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-label="Passation">
        <h2>Relis la passation</h2>
        <p className="muted">La session neuve ne recevra que ce texte, comme premier message.</p>
        <textarea className="dialog-text" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        {error && <div className="msg-error">⚠️ {error}</div>}
        <div className="dialog-actions">
          <button onClick={onCancel} disabled={busy}>Annuler</button>
          <button className="primary" onClick={() => onConfirm(text)} disabled={busy || !text.trim()}>
            Ouvrir une session neuve
          </button>
        </div>
      </div>
    </div>
  );
}
