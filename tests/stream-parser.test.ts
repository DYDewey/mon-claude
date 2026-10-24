import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStreamParser } from '../src/main/stream-parser';

const fixture = readFileSync(join(__dirname, 'fixtures/stream-bonjour.jsonl'), 'utf8');

describe('createStreamParser', () => {
  it('transforme le vrai flux en text-delta puis turn-end', () => {
    const parser = createStreamParser('s1');
    const events = parser.push(fixture);

    expect(events.map((e) => e.type)).toEqual(['text-delta', 'turn-end']);
    expect(events[0]).toEqual({ type: 'text-delta', sessionId: 's1', text: 'bonjour' });
    expect(events[1]).toMatchObject({ type: 'turn-end', sessionId: 's1', result: 'bonjour' });
  });

  it('recolle une ligne coupée en plusieurs morceaux', () => {
    const parser = createStreamParser('s1');
    const line = fixture.split('\n').find((l) => l.includes('"text_delta"'))! + '\n';
    const cut = Math.floor(line.length / 2);

    expect(parser.push(line.slice(0, cut))).toEqual([]);
    expect(parser.push(line.slice(cut))).toEqual([
      { type: 'text-delta', sessionId: 's1', text: 'bonjour' },
    ]);
  });

  it('ignore les lignes invalides et les types inconnus', () => {
    const parser = createStreamParser('s1');
    const events = parser.push('pas du json\n{"type":"truc_inconnu"}\n\r\n');
    expect(events).toEqual([]);
  });

  it('gère les fins de ligne Windows', () => {
    const parser = createStreamParser('s1');
    const crlf = fixture.split('\n').join('\r\n');
    expect(parser.push(crlf).map((e) => e.type)).toEqual(['text-delta', 'turn-end']);
  });

  it('émet une erreur puis turn-end quand le résultat est en échec', () => {
    const parser = createStreamParser('s1');
    const line = JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'boom' });
    expect(parser.push(line + '\n')).toEqual([
      { type: 'error', sessionId: 's1', message: 'boom' },
      { type: 'turn-end', sessionId: 's1', result: 'boom' },
    ]);
  });
});
