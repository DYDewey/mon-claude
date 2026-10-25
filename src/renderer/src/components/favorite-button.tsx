import { Star } from 'lucide-react';

/** Étoile pleine si favori ; le clic ne doit pas ouvrir aussi la session de la ligne. */
export function FavoriteButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const label = on ? 'Retirer des favoris' : 'Ajouter aux favoris';
  return (
    <button
      className={`btn-icon star${on ? ' on' : ''}`}
      aria-label={label}
      aria-pressed={on}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Star size={14} aria-hidden />
    </button>
  );
}
