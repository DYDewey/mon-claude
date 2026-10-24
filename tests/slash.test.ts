import { describe, expect, it } from 'vitest';
import { matchCommands } from '../src/renderer/src/components/slash-menu';

const all = ['review', 'aide-decision', 'anthropic-skills:passation', 'garde-contexte', 'claude-mem:handoff'];

describe('matchCommands', () => {
  it('rien tant que le texte ne commence pas par /', () => {
    expect(matchCommands('bonjour', all)).toEqual([]);
  });

  it('juste « / » propose tout', () => {
    expect(matchCommands('/', all)).toHaveLength(all.length);
  });

  it('les noms qui commencent par la saisie passent avant ceux qui la contiennent', () => {
    expect(matchCommands('/pa', all)).toEqual(['anthropic-skills:passation']);
    expect(matchCommands('/a', all).slice(0, 2)).toEqual(['aide-decision', 'anthropic-skills:passation']);
  });

  it('on ne propose plus rien une fois un espace tapé (on écrit les arguments)', () => {
    expect(matchCommands('/review mon code', all)).toEqual([]);
  });

  it('ignore la casse', () => {
    expect(matchCommands('/GARDE', all)).toEqual(['garde-contexte']);
  });
});
