import { Plus } from 'lucide-react';

/** Écran affiché quand aucune session n'est ouverte. */
export function Welcome({ onNew }: { onNew: () => void }) {
  return (
    <main className="welcome">
      <div className="logo" aria-hidden>C</div>
      <h1>Bonjour, que fait-on ?</h1>
      <button onClick={onNew}>
        <Plus size={16} aria-hidden /> Nouvelle session
      </button>
    </main>
  );
}
