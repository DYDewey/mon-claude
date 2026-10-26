import { describe, expect, it } from 'vitest';
import type { ChatItem } from '../src/shared/chat-item';
import { fold, matchSession, searchableTexts, searchTerms, snippet, validQuery } from '../src/shared/search';

describe('fold', () => {
  it('enlève casse et accents', () => {
    expect(fold('Électron Été')).toBe('electron ete');
  });
});

describe('searchTerms', () => {
  it('découpe en mots pliés', () => {
    expect(searchTerms('  React   Hooks ')).toEqual(['react', 'hooks']);
  });
  it('rien sous 3 caractères au total', () => {
    expect(searchTerms('ab')).toEqual([]);
    expect(searchTerms('a b')).toEqual([]);
    expect(searchTerms('ab c')).toEqual(['ab', 'c']);
  });
});

describe('searchableTexts', () => {
  it('garde user et assistant avec leur index, ignore les outils', () => {
    const items: ChatItem[] = [
      { kind: 'user', text: 'salut' },
      { kind: 'tool', name: 'Bash', input: { command: 'secret' } },
      { kind: 'assistant', text: 'bonjour' },
    ];
    expect(searchableTexts(items)).toEqual([
      { index: 0, text: 'salut', folded: 'salut' },
      { index: 2, text: 'bonjour', folded: 'bonjour' },
    ]);
  });
});

describe('matchSession', () => {
  const t = (index: number, text: string) => ({ index, text, folded: fold(text) });
  const texts = [
    t(0, 'Comment marche React ?'),
    t(3, 'Les hooks de React'),
    t(5, 'Autre chose'),
  ];
  it('compte les messages trouvés et donne le premier', () => {
    expect(matchSession(texts, ['react'])).toEqual({ count: 2, first: 0, term: 'react' });
  });
  it('tous les mots requis, pas forcément dans le même message', () => {
    expect(matchSession(texts, ['hooks', 'autre'])).toEqual({ count: 2, first: 3, term: 'hooks' });
    expect(matchSession(texts, ['react', 'vue'])).toBeNull();
  });
  it('sans accents ni casse', () => {
    expect(matchSession([t(0, 'Électron')], ['electron'])).not.toBeNull();
  });
});

describe('snippet', () => {
  it('extrait autour du mot, mot isolé pour le surlignage', () => {
    const text = 'a'.repeat(200) + ' Électron ' + 'b'.repeat(200);
    const s = snippet(text, 'electron');
    expect(s.match).toBe('Électron');
    expect(s.before.startsWith('…')).toBe(true);
    expect(s.after.endsWith('…')).toBe(true);
    expect((s.before + s.match + s.after).length).toBeLessThanOrEqual(124);
  });
  it('mot en début ou en fin de texte : pas de points de suspension inutiles', () => {
    expect(snippet('react est bien', 'react')).toEqual({ before: '', match: 'react', after: ' est bien' });
    expect(snippet('vive react', 'react')).toEqual({ before: 'vive ', match: 'react', after: '' });
  });
  it('remplace les retours à la ligne par des espaces', () => {
    expect(snippet('un\n\ndeux react', 'react').before).toBe('un deux ');
  });
});

describe('validQuery', () => {
  it('chaîne de 200 caractères max', () => {
    expect(validQuery('react')).toBe(true);
    expect(validQuery('x'.repeat(201))).toBe(false);
    expect(validQuery(42)).toBe(false);
  });
});
