import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoryView } from '../src/renderer/src/components/history-view';

const base = { title: 'Module usage', path: 'C:\\dev\\proj' };

describe('HistoryView', () => {
  it('affiche les messages avec un bandeau Lecture seule, sans zone de saisie', () => {
    const html = renderToStaticMarkup(
      <HistoryView {...base} items={[{ kind: 'user', text: 'bonjour' }, { kind: 'assistant', text: '**salut**' }]} />,
    );
    expect(html).toContain('Module usage');
    // Seul le nom du dossier s'affiche ; le chemin complet est en infobulle.
    expect(html).toMatch(/title="C:\\dev\\proj"[^>]*>proj</);
    expect(html).toContain('Lecture seule');
    expect(html).toContain('bonjour');
    expect(html).toContain('<strong>salut</strong>');
    expect(html).not.toContain('<textarea');
  });

  it("n'affiche pas le dossier s'il répète le titre", () => {
    const html = renderToStaticMarkup(<HistoryView title="proj" path="C:\\dev\\proj" items={[]} />);
    expect(html).not.toContain('topbar-folder');
  });

  it('pendant le chargement, puis en cas d\'erreur', () => {
    expect(renderToStaticMarkup(<HistoryView {...base} />)).toContain('Chargement…');
    expect(renderToStaticMarkup(<HistoryView {...base} error="fichier introuvable" />)).toContain('fichier introuvable');
  });
});
