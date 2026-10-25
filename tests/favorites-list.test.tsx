import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FavoritesList } from '../src/renderer/src/components/favorites-list';
import type { HistoryProject } from '../src/shared/history';
import { emptyOrganize, toggleFavorite } from '../src/shared/organize';

const projects: HistoryProject[] = [
  { folder: 'C--a', path: 'C:/proj/alpha', sessions: [{ id: 's1', title: 'Ancienne', lastAt: 100, messageCount: 1 }] },
  { folder: 'C--b', sessions: [{ id: 's2', title: 'Récente', lastAt: 200, messageCount: 1 }] },
];
const noop = () => {};
const render = (organize = emptyOrganize(), openKey?: string) =>
  renderToStaticMarkup(
    <FavoritesList projects={projects} organize={organize} openKey={openKey} onOpen={noop} onToggleFavorite={noop} />,
  );

describe('FavoritesList', () => {
  it('cachée s’il n’y a aucun favori', () => {
    expect(render()).toBe('');
  });

  it('liste plate, plus récente d’abord, avec le nom du projet', () => {
    const organize = toggleFavorite(toggleFavorite(emptyOrganize(), 'C--a/s1'), 'C--b/s2');
    const html = render(organize);
    expect(html).toContain('Favoris');
    expect(html.indexOf('Récente')).toBeLessThan(html.indexOf('Ancienne'));
    expect(html).toContain('alpha');
    expect(html).toContain('C--b');
    expect(html.match(/aria-label="Retirer des favoris"/g)).toHaveLength(2);
  });

  it('la session affichée est surlignée', () => {
    const html = render(toggleFavorite(emptyOrganize(), 'C--a/s1'), 'C--a/s1');
    expect(html).toContain('class="active"');
  });
});
