import { describe, expect, it } from 'vitest';
import { buildClaudeArgs } from '../src/main/claude-args';

const base = [
  '-p',
  '--input-format', 'stream-json',
  '--output-format', 'stream-json',
  '--verbose',
  '--include-partial-messages',
  '--permission-mode', 'acceptEdits',
];

describe('buildClaudeArgs', () => {
  it('nouvelle session : impose notre identifiant', () => {
    expect(buildClaudeArgs({ sessionId: 'abc' })).toEqual([...base, '--session-id', 'abc']);
  });

  it('reprise : utilise --resume', () => {
    expect(buildClaudeArgs({ sessionId: 'abc', resume: true })).toEqual([...base, '--resume', 'abc']);
  });

  it("n'utilise jamais --bare (les skills perso doivent se charger)", () => {
    expect(buildClaudeArgs({ sessionId: 'abc' })).not.toContain('--bare');
  });
});
