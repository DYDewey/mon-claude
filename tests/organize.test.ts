import { describe, expect, it } from 'vitest';
import type { HistoryProject } from '../src/shared/history';
import {
  displayTitle,
  emptyOrganize,
  favoriteSessions,
  parseOrganize,
  renameSession,
  sessionKey,
  toggleFavorite,
} from '../src/shared/organize';

const projects: HistoryProject[] = [
  {
    folder: 'C--proj-a',
    path: 'C:\\proj\\a',
    sessions: [
      { id: 's1', title: 'Explique-moi les promesses', lastAt: 300, messageCount: 4 },
      { id: 's2', title: 'Bug CSS', lastAt: 100, messageCount: 2 },
    ],
  },
  { folder: 'C--proj-b', sessions: [{ id: 's3', title: 'Maths', lastAt: 200, messageCount: 6 }] },
];

describe('sessionKey', () => {
  it('assemble dossier et id', () => {
    expect(sessionKey('C--proj-a', 's1')).toBe('C--proj-a/s1');
  });
});

describe('toggleFavorite', () => {
  it('ajoute puis retire, sans modifier la donnée de départ', () => {
    const start = emptyOrganize();
    const on = toggleFavorite(start, 'a/s1');
    expect(on.sessions['a/s1']).toEqual({ favorite: true });
    expect(start.sessions).toEqual({});
    expect(toggleFavorite(on, 'a/s1').sessions).toEqual({});
  });

  it('garde le nom personnalisé quand on retire le favori', () => {
    const data = renameSession(toggleFavorite(emptyOrganize(), 'a/s1'), 'a/s1', 'Promesses');
    expect(toggleFavorite(data, 'a/s1').sessions['a/s1']).toEqual({ title: 'Promesses' });
  });
});

describe('renameSession', () => {
  it('enregistre le nom sans espaces autour', () => {
    expect(renameSession(emptyOrganize(), 'a/s1', '  Promesses JS ').sessions['a/s1']).toEqual({ title: 'Promesses JS' });
  });

  it('un nom vide remet le titre d’origine et retire l’entrée devenue vide', () => {
    const named = renameSession(emptyOrganize(), 'a/s1', 'Promesses');
    expect(renameSession(named, 'a/s1', '   ').sessions).toEqual({});
  });

  it('un nom vide garde le favori', () => {
    const data = renameSession(toggleFavorite(emptyOrganize(), 'a/s1'), 'a/s1', 'X');
    expect(renameSession(data, 'a/s1', '').sessions['a/s1']).toEqual({ favorite: true });
  });
});

describe('displayTitle', () => {
  it('préfère le nom personnalisé', () => {
    expect(displayTitle({ title: 'Original' }, { title: 'Perso' })).toBe('Perso');
    expect(displayTitle({ title: 'Original' }, undefined)).toBe('Original');
  });
});

describe('favoriteSessions', () => {
  it('liste plate, plus récente d’abord, favoris disparus ignorés', () => {
    let data = toggleFavorite(emptyOrganize(), 'C--proj-a/s2');
    data = toggleFavorite(data, 'C--proj-b/s3');
    data = toggleFavorite(data, 'C--proj-a/disparu');
    expect(favoriteSessions(projects, data).map((f) => f.session.id)).toEqual(['s3', 's2']);
    expect(favoriteSessions(projects, data)[1].project.folder).toBe('C--proj-a');
  });

  it('vide sans favori', () => {
    expect(favoriteSessions(projects, renameSession(emptyOrganize(), 'C--proj-a/s1', 'X'))).toEqual([]);
  });
});

describe('parseOrganize', () => {
  it('relit une donnée valide', () => {
    const data = renameSession(toggleFavorite(emptyOrganize(), 'a/s1'), 'a/s1', 'P');
    expect(parseOrganize(JSON.stringify(data))).toEqual(data);
  });

  it('relit les projets ; un ancien fichier sans projets reste valide', () => {
    const projects = { p_react001: { name: 'React', folder: 'D:\\react', instructions: 'Sois bref' } };
    expect(parseOrganize(JSON.stringify({ version: 1, sessions: {}, projects }))?.projects).toEqual(projects);
    expect(parseOrganize('{"version":1,"sessions":{}}')).toEqual(emptyOrganize());
  });

  it('JSON invalide ou version inconnue → null', () => {
    expect(parseOrganize('{pas du json')).toBeNull();
    expect(parseOrganize('{"version":2,"sessions":{}}')).toBeNull();
    expect(parseOrganize('[]')).toBeNull();
  });

  it('nettoie les champs en trop ou mal typés', () => {
    const text = JSON.stringify({
      version: 1,
      extra: 1,
      sessions: { 'a/s1': { favorite: true, title: 'P', color: 'red' }, 'a/s2': { favorite: 'oui', title: 3 }, 'a/s3': 'x' },
    });
    expect(parseOrganize(text)).toEqual({ version: 1, sessions: { 'a/s1': { favorite: true, title: 'P' } } });
  });

  it('ignore une clé sans « dossier/id », dont __proto__', () => {
    const text = '{"version":1,"sessions":{"__proto__":{"favorite":true},"seul":{"favorite":true},"a/s1":{"favorite":true}}}';
    const data = parseOrganize(text);
    expect(data).toEqual({ version: 1, sessions: { 'a/s1': { favorite: true } } });
    expect(data?.sessions['a/autre']).toBeUndefined();
  });
});
