import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HistoryList, projectLabel } from '../src/renderer/src/components/history-list';
import type { HistoryProject } from '../src/shared/history';

const NOW = Date.parse('2026-10-24T12:00:00Z');
const projects: HistoryProject[] = [
  {
    folder: 'C--Users-moi-Documents-mon-claude',
    path: 'C:\\Users\\moi\\Documents\\mon-claude',
    sessions: [
      { id: 's2', title: 'Module usage', lastAt: NOW - 2 * 86_400_000, messageCount: 12 },
      { id: 's1', title: 'Spec <chat>', lastAt: NOW - 3 * 3_600_000, messageCount: 4 },
    ],
  },
  { folder: 'D--Cours', sessions: [{ id: 'x', title: 'Oral', lastAt: NOW, messageCount: 1 }] },
];

const noop = () => {};
const render = (openKey?: string) =>
  renderToStaticMarkup(
    <HistoryList projects={projects} now={NOW} openKey={openKey} onOpen={noop} onRefresh={noop} />,
  );

describe('projectLabel', () => {
  it('dernier dossier du vrai chemin, sinon nom du dossier encodé', () => {
    expect(projectLabel(projects[0])).toBe('mon-claude');
    expect(projectLabel(projects[1])).toBe('D--Cours');
  });
});

describe('HistoryList', () => {
  it('un projet repliable (fermé par défaut) par dossier, avec son nombre de sessions', () => {
    const html = render();
    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html).not.toContain('<details open');
    expect(html).toContain('mon-claude');
    expect(html).toContain('(2)');
  });

  it('chaque session : titre (échappé) et date relative', () => {
    const html = render();
    expect(html).toContain('Module usage');
    expect(html).toContain('il y a 2 j');
    expect(html).toContain('Spec &lt;chat&gt;');
    expect(html).toContain('il y a 3 h');
  });

  it('la session ouverte est marquée et son projet déplié', () => {
    const html = render('C--Users-moi-Documents-mon-claude/s1');
    expect(html).toContain('<details open');
    expect(html.match(/class="active"/g)).toHaveLength(1);
  });
});
