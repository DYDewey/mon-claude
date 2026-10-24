import { describe, expect, it } from 'vitest';
import { buildClaudeArgs } from '../src/main/claude-args';

const base = [
  '-p',
  '--input-format', 'stream-json',
  '--output-format', 'stream-json',
  '--verbose',
  '--include-partial-messages',
  '--permission-mode', 'acceptEdits',
  '--prompt-suggestions', 'true',
];

describe('buildClaudeArgs', () => {
  it('nouvelle session : impose notre identifiant', () => {
    expect(buildClaudeArgs({ sessionId: 'abc' })).toEqual([...base, '--session-id', 'abc']);
  });

  it('reprise : utilise --resume', () => {
    expect(buildClaudeArgs({ sessionId: 'abc', resume: true })).toEqual([...base, '--resume', 'abc']);
  });

  it('ajoute --model quand un modèle est choisi', () => {
    expect(buildClaudeArgs({ sessionId: 'abc', model: 'sonnet' })).toEqual([...base, '--model', 'sonnet', '--session-id', 'abc']);
    expect(buildClaudeArgs({ sessionId: 'abc', resume: true, model: 'haiku' })).toEqual([...base, '--model', 'haiku', '--resume', 'abc']);
  });

  it("« Par défaut » : pas d'option --model", () => {
    expect(buildClaudeArgs({ sessionId: 'abc' })).not.toContain('--model');
  });

  it("n'utilise jamais --bare (les skills perso doivent se charger)", () => {
    expect(buildClaudeArgs({ sessionId: 'abc' })).not.toContain('--bare');
  });
});
