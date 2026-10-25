import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';

/** Échap ferme le dialogue, sauf pendant l'enregistrement (comme le bouton Annuler grisé). */
export function shouldCancel(key: string, busy: boolean): boolean {
  return key === 'Escape' && !busy;
}

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
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Passation"
        onKeyDown={(e) => {
          if (shouldCancel(e.key, busy)) onCancel();
        }}
      >
        <h2>Relis la passation</h2>
        <p className="muted">La session neuve ne recevra que ce texte, comme premier message.</p>
        <textarea className="dialog-text" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        {error && <div className="msg-error"><TriangleAlert size={14} aria-hidden /> {error}</div>}
        <div className="dialog-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button onClick={() => onConfirm(text)} disabled={busy || !text.trim()}>
            Ouvrir une session neuve
          </button>
        </div>
      </div>
    </div>
  );
}
