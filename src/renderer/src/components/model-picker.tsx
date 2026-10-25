import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MODEL_CHOICES, type ModelChoice } from '../../../shared/model';

/** « Par défaut » (undefined) puis les modèles, dans l'ordre du menu. */
export const MODEL_OPTIONS: { value: ModelChoice | undefined; label: string }[] = [
  { value: undefined, label: 'Par défaut' },
  ...MODEL_CHOICES,
];

interface MenuState {
  open: boolean;
  index: number;
}

/** Effet d'une touche sur le menu ; `choose` = valider l'option `index`. */
export function menuKey(state: MenuState, key: string, count: number): MenuState & { choose?: true } {
  if (key === 'ArrowDown') return { open: true, index: state.open ? (state.index + 1) % count : state.index };
  if (key === 'ArrowUp') return { open: true, index: state.open ? (state.index - 1 + count) % count : state.index };
  if (key === 'Enter' && state.open) return { open: false, index: state.index, choose: true };
  if (key === 'Escape') return { open: false, index: state.index };
  return state;
}

export function ModelPicker({
  value,
  activeModel,
  disabled,
  onChange,
  initialOpen = false,
}: {
  value?: ModelChoice;
  /** Modèle réellement utilisé, lu dans le flux (inconnu avant la 1re réponse). */
  activeModel?: string;
  disabled: boolean;
  onChange: (model: ModelChoice | undefined) => void;
  /** Pour les tests : rendu avec le menu déjà ouvert. */
  initialOpen?: boolean;
}) {
  const current = Math.max(0, MODEL_OPTIONS.findIndex((o) => o.value === value));
  const [menu, setMenu] = useState<MenuState>({ open: initialOpen, index: current });
  const root = useRef<HTMLSpanElement>(null);

  // Un clic en dehors du menu le ferme.
  useEffect(() => {
    if (!menu.open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenu((m) => ({ ...m, open: false }));
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu.open]);

  function choose(index: number) {
    setMenu({ open: false, index });
    if (index !== current) onChange(MODEL_OPTIONS[index].value);
  }

  function onKeyDown(e: KeyboardEvent) {
    const next = menuKey(menu.open ? menu : { open: false, index: current }, e.key, MODEL_OPTIONS.length);
    if (next === menu) return;
    e.preventDefault();
    if (next.choose) choose(next.index);
    else setMenu({ open: next.open, index: next.index });
  }

  return (
    <span className="model-picker" ref={root}>
      <button
        type="button"
        className="btn-secondary model-btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={menu.open}
        onClick={() => setMenu({ open: !menu.open, index: current })}
        onKeyDown={onKeyDown}
        title="Modèle de la session : le changer relance claude, la conversation continue"
      >
        {MODEL_OPTIONS[current].label}
        <ChevronDown size={14} aria-hidden />
      </button>
      {menu.open && (
        <ul className="model-menu" role="listbox" aria-label="Modèle">
          {MODEL_OPTIONS.map((o, i) => (
            <li
              key={o.label}
              role="option"
              aria-selected={i === current}
              className={i === menu.index ? 'selected' : undefined}
              onMouseDown={(e) => e.preventDefault()} // garde le focus sur le bouton
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {i === current && <Check size={14} aria-hidden />}
            </li>
          ))}
          {activeModel && <li className="model-active muted">Utilisé : {activeModel}</li>}
        </ul>
      )}
    </span>
  );
}
