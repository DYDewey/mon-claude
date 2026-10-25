import { Pencil } from 'lucide-react';
import { useState } from 'react';

/** Touche dans le champ de renommage : valider, annuler, ou null (laissée à la saisie). */
export function renameKey(key: string): 'save' | 'cancel' | null {
  if (key === 'Enter') return 'save';
  if (key === 'Escape') return 'cancel';
  return null;
}

/** Crayon ; le clic ne doit pas ouvrir aussi la session de la ligne. */
export function RenameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="btn-icon rename"
      aria-label="Renommer"
      title="Renommer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Pencil size={14} aria-hidden />
    </button>
  );
}

/** Champ qui remplace le titre : Entrée ou perte du focus valide, Échap annule. Un nom vide remet le titre d'origine. */
export function RenameField({ initial, onSave, onCancel }: { initial: string; onSave: (title: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial);
  // Échap puis la perte du focus qui suit ne doivent pas valider après coup.
  const [done, setDone] = useState(false);
  const finish = (action: 'save' | 'cancel') => {
    if (done) return;
    setDone(true);
    if (action === 'save') onSave(text);
    else onCancel();
  };
  return (
    <input
      className="rename-field"
      value={text}
      aria-label="Nouveau nom"
      autoFocus
      onFocus={(e) => e.target.select()}
      onChange={(e) => setText(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const action = renameKey(e.key);
        if (!action) return;
        e.preventDefault();
        e.stopPropagation(); // Échap ne doit rien fermer d'autre
        finish(action);
      }}
      onBlur={() => finish('save')}
    />
  );
}
