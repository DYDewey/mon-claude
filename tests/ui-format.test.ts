import { describe, expect, it } from 'vitest';
import { filterHistory, folderLabel } from '../src/renderer/src/ui-format';
import type { HistoryProject } from '../src/shared/history';

describe('folderLabel', () => {
  it('garde le dernier dossier du chemin', () => {
    expect(folderLabel('C:\\Users\\moi\\Documents\\mon-claude')).toBe('mon-claude');
    expect(folderLabel('D:/Cours/maths')).toBe('maths');
  });

  it('ignore le séparateur final', () => {
    expect(folderLabel('C:\\proj\\')).toBe('proj');
  });

  it('renvoie la racine telle quelle', () => {
    expect(folderLabel('C:\\')).toBe('C:');
  });
});

describe('filterHistory', () => {
  const s = (id: string, title: string) => ({ id, title, lastAt: 0, messageCount: 1 });
  const projects: HistoryProject[] = [
    { folder: 'C--mon-claude', path: 'C:\\dev\\mon-claude', sessions: [s('a', 'Passation du module'), s('b', 'Spec usage')] },
    { folder: 'D--Cours-ete', path: 'D:\\Cours\\Été', sessions: [s('c', 'Oral'), s('d', 'Révisions')] },
  ];

  it('cherche dans le titre affiché (nom personnalisé) quand il est fourni', () => {
    const titleOf = (folder: string, session: { id: string; title: string }) =>
      folder === 'D--Cours-ete' && session.id === 'c' ? 'Promesses JS' : session.title;
    expect(filterHistory(projects, 'promesses js', titleOf)).toEqual([{ ...projects[1], sessions: [projects[1].sessions[0]] }]);
    expect(filterHistory(projects, 'oral', titleOf)).toEqual([]);
  });

  it('requête vide : tout est gardé', () => {
    expect(filterHistory(projects, '  ')).toEqual(projects);
  });

  it('filtre les sessions par titre, sans tenir compte des majuscules', () => {
    expect(filterHistory(projects, 'passa')).toEqual([{ ...projects[0], sessions: [projects[0].sessions[0]] }]);
  });

  it('ignore les accents dans les deux sens', () => {
    expect(filterHistory(projects, 'revision')[0].sessions.map((x) => x.id)).toEqual(['d']);
    expect(filterHistory(projects, 'éte')).toEqual([projects[1]]);
  });

  it('un projet trouvé par son nom garde toutes ses sessions', () => {
    expect(filterHistory(projects, 'mon-cl')).toEqual([projects[0]]);
  });

  it('aucun résultat : liste vide', () => {
    expect(filterHistory(projects, 'zzz')).toEqual([]);
  });
});
