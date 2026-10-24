import { describe, expect, it } from 'vitest';
import type { ChatItem } from '../src/shared/chat-item';
import { buildHandoffPrompt, handoffFileName, handoffResult } from '../src/shared/handoff';

describe('handoff', () => {
  it('buildHandoffPrompt contient chaque section du modèle', () => {
    const prompt = buildHandoffPrompt();
    for (const section of [
      '## Objectif',
      '## Où on en est',
      '## Contexte indispensable',
      '## Décisions',
      '## Fait',
      '## Reste à faire',
      '## Fichiers & commandes',
      '## Pièges',
    ]) {
      expect(prompt).toContain(section);
    }
    expect(prompt).toContain('40 lignes');
    expect(prompt).toContain('inconnu');
  });

  it('handoffResult renvoie le texte assistant après fromIndex, sans les outils', () => {
    const items: ChatItem[] = [
      { kind: 'user', text: 'ancien' },
      { kind: 'assistant', text: 'vieille réponse' },
      { kind: 'user', text: 'consigne' },
      { kind: 'tool', name: 'Read', input: {} },
      { kind: 'assistant', text: '# Passation\n' },
      { kind: 'assistant', text: '## Objectif' },
    ];
    expect(handoffResult(items, 2)).toBe('# Passation\n\n## Objectif');
  });

  it("handoffResult renvoie null en cas d'erreur, d'arrêt ou de texte vide", () => {
    const base: ChatItem[] = [{ kind: 'assistant', text: 'vieille réponse' }, { kind: 'user', text: 'consigne' }];
    expect(handoffResult([...base, { kind: 'assistant', text: 'x' }, { kind: 'error', message: 'boum' }], 1)).toBeNull();
    expect(handoffResult([...base, { kind: 'assistant', text: 'x' }, { kind: 'stopped' }], 1)).toBeNull();
    expect(handoffResult([...base, { kind: 'assistant', text: '  \n' }], 1)).toBeNull();
    expect(handoffResult(base, 1)).toBeNull();
  });

  it('handoffFileName : date locale + 6 premiers caractères de la session', () => {
    const date = new Date(2026, 9, 4, 9, 5);
    expect(handoffFileName(date, '6f0f87ab-1234')).toBe('2026-10-04_09h05_6f0f87.md');
  });
});
