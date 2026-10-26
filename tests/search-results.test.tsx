import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoryList } from '../src/renderer/src/components/history-list';
import { SearchResults } from '../src/renderer/src/components/search-results';
import { emptyOrganize, renameSession } from '../src/shared/organize';
import type { SearchHit } from '../src/shared/search';

const noop = () => {};
const hit: SearchHit = {
  folder: 'C--proj',
  id: 's1',
  title: 'Titre <auto>',
  path: 'C:\\Users\\moi\\proj',
  lastAt: 0,
  count: 3,
  focusIndex: 4,
  snippet: { before: '…le ', match: 'cleanup', after: ' de useEffect' },
};
const render = (results: SearchHit[] | 'loading' | null, organize = emptyOrganize()) =>
  renderToStaticMarkup(<SearchResults results={results} organize={organize} onOpen={noop} />);

describe('SearchResults', () => {
  it('rien sans requête assez longue', () => {
    expect(render(null)).toBe('');
  });
  it('« Recherche… » puis « Rien trouvé »', () => {
    expect(render('loading')).toContain('Recherche…');
    expect(render([])).toContain('Rien trouvé dans les conversations');
  });
  it('titre, projet, nombre et extrait surligné (échappé)', () => {
    const html = render([hit]);
    expect(html).toContain('Dans les conversations');
    expect(html).toContain('Titre &lt;auto&gt;');
    expect(html).toContain('proj');
    expect(html).toContain('3 messages');
    expect(html).toContain('…le <mark>cleanup</mark> de useEffect');
  });
  it('nom personnalisé prioritaire', () => {
    expect(render([hit], renameSession(emptyOrganize(), 'C--proj/s1', 'Mon nom'))).toContain('Mon nom');
  });
});

describe('HistoryList + recherche dans le contenu', () => {
  const list = (q: string) =>
    renderToStaticMarkup(
      <HistoryList projects={[]} now={0} onOpen={noop} onRefresh={noop} initialQuery={q} search={async () => []} />,
    );
  it('section cachée sous 3 caractères', () => {
    expect(list('ab')).not.toContain('Dans les conversations');
  });
  it('section affichée dès 3 caractères', () => {
    expect(list('abc')).toContain('Recherche…');
  });
});
