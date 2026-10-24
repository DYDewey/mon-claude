import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HandoffButton } from '../src/renderer/src/components/handoff-button';
import { handoffPhase } from '../src/renderer/src/handoff-flow';
import type { SessionState } from '../src/renderer/src/state/sessions';

const session = (patch: Partial<SessionState>): SessionState => ({
  id: 's1',
  cwd: 'C:\\proj',
  title: 'proj',
  items: [{ kind: 'user', text: 'bonjour' }, { kind: 'assistant', text: 'salut' }],
  status: 'idle',
  unread: false,
  ...patch,
});

describe('handoffPhase', () => {
  const pending = { sessionId: 's1', fromIndex: 2 };

  it('aucune passation, ou pour une autre session', () => {
    expect(handoffPhase(null, session({}))).toEqual({ phase: 'none' });
    expect(handoffPhase({ ...pending, sessionId: 's2' }, session({}))).toEqual({ phase: 'none' });
  });

  it('en cours tant que claude répond', () => {
    const items = [...session({}).items, { kind: 'user' as const, text: 'consigne' }];
    expect(handoffPhase(pending, session({ items, status: 'running' }))).toEqual({ phase: 'writing' });
  });

  it('prête quand le tour est fini avec un texte', () => {
    const items = [...session({}).items, { kind: 'user' as const, text: 'consigne' }, { kind: 'assistant' as const, text: '# Passation' }];
    expect(handoffPhase(pending, session({ items }))).toEqual({ phase: 'review', text: '# Passation' });
  });

  it('échouée quand le tour est fini sans texte ou avec une erreur', () => {
    const items = [...session({}).items, { kind: 'user' as const, text: 'consigne' }, { kind: 'error' as const, message: 'boum' }];
    expect(handoffPhase(pending, session({ items }))).toEqual({ phase: 'failed' });
  });
});

describe('HandoffButton', () => {
  it('actif quand la session est au repos avec des messages', () => {
    const html = renderToStaticMarkup(<HandoffButton session={session({})} phase="none" onClick={() => {}} />);
    expect(html).toContain('Passation');
    expect(html).not.toContain('disabled');
  });

  it('désactivé pendant une réponse ou sans message', () => {
    for (const s of [session({ status: 'running' }), session({ items: [] })]) {
      expect(renderToStaticMarkup(<HandoffButton session={s} phase="none" onClick={() => {}} />)).toContain('disabled');
    }
  });

  it('affiche la rédaction en cours, puis l\'échec', () => {
    const writing = renderToStaticMarkup(<HandoffButton session={session({ status: 'running' })} phase="writing" onClick={() => {}} />);
    expect(writing).toContain('Passation en cours');
    const failed = renderToStaticMarkup(<HandoffButton session={session({})} phase="failed" onClick={() => {}} />);
    expect(failed).toContain('Passation impossible');
  });
});
