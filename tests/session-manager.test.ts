import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { SessionManager } from '../src/main/session-manager';
import type { BridgeEvent } from '../src/shared/events';

const fakeClaude = { command: process.execPath, prefixArgs: [join(__dirname, 'fixtures/fake-claude.cjs')] };

function waitFor(events: BridgeEvent[], type: BridgeEvent['type']): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`pas d'événement ${type}`)), 5000);
    const check = setInterval(() => {
      if (events.some((e) => e.type === type)) {
        clearInterval(check);
        clearTimeout(timer);
        resolve();
      }
    }, 20);
  });
}

describe('SessionManager', () => {
  it('envoie un message et reçoit la réponse en flux', async () => {
    const events: BridgeEvent[] = [];
    const manager = new SessionManager((e) => events.push(e), fakeClaude);

    const id = manager.start(tmpdir());
    manager.send(id, 'bonjour');
    await waitFor(events, 'turn-end');

    expect(events.filter((e) => e.type === 'text-delta')).toEqual([{ type: 'text-delta', sessionId: id, text: 'bonjour' }]);
    manager.stopAll();
  });

  it('émet une erreur lisible si claude est introuvable', async () => {
    const events: BridgeEvent[] = [];
    const manager = new SessionManager((e) => events.push(e), { command: 'claude-introuvable-xyz' });

    manager.start(tmpdir());
    await waitFor(events, 'error');

    expect(events[0]).toMatchObject({ type: 'error', message: expect.stringContaining('introuvable') });
  });

  it('interrupt termine le tour sans erreur et la session reste utilisable', async () => {
    const events: BridgeEvent[] = [];
    const manager = new SessionManager((e) => events.push(e), fakeClaude);

    const id = manager.start(tmpdir());
    manager.interrupt(id);
    await waitFor(events, 'turn-end');
    expect(events.some((e) => e.type === 'error')).toBe(false);

    events.length = 0;
    manager.send(id, 'encore');
    await waitFor(events, 'text-delta');
    expect(manager.has(id)).toBe(true);
    manager.stopAll();
  });

  it('stop arrête le processus', async () => {
    const events: BridgeEvent[] = [];
    const manager = new SessionManager((e) => events.push(e), fakeClaude);

    const id = manager.start(tmpdir());
    expect(manager.has(id)).toBe(true);
    manager.stop(id);
    expect(manager.has(id)).toBe(false);
  });
});
