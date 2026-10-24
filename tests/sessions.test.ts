import { describe, expect, it } from 'vitest';
import { initialState, sessionsReducer, type ChatAction, type ChatState } from '../src/renderer/src/state/sessions';

const run = (actions: ChatAction[], state: ChatState = initialState) => actions.reduce(sessionsReducer, state);

const twoSessions = run([
  { type: 'session-opened', sessionId: 'a', cwd: 'C:\\projets\\alpha' },
  { type: 'session-opened', sessionId: 'b', cwd: 'C:\\projets\\beta' },
]);

describe('sessionsReducer', () => {
  it('ouvre une session, la rend active, titre = nom du dossier', () => {
    const state = run([{ type: 'session-opened', sessionId: 'a', cwd: 'C:\\projets\\alpha' }]);
    expect(state.activeId).toBe('a');
    expect(state.sessions[0]).toMatchObject({ id: 'a', title: 'alpha', status: 'idle', unread: false, items: [] });
  });

  it('le 1er message devient le titre et la session passe en cours', () => {
    const state = run([{ type: 'user-sent', sessionId: 'b', text: 'Explique-moi les reducers en React' }], twoSessions);
    const b = state.sessions.find((s) => s.id === 'b')!;
    expect(b.title).toBe('Explique-moi les reducers en React');
    expect(b.status).toBe('running');
    expect(b.items).toEqual([{ kind: 'user', text: 'Explique-moi les reducers en React' }]);
  });

  it('text-delta s\'ajoute au dernier message Claude de la bonne session', () => {
    const state = run(
      [
        { type: 'user-sent', sessionId: 'b', text: 'salut' },
        { type: 'text-delta', sessionId: 'b', text: 'Bon' },
        { type: 'text-delta', sessionId: 'b', text: 'jour' },
      ],
      twoSessions,
    );
    expect(state.sessions.find((s) => s.id === 'b')!.items.at(-1)).toEqual({ kind: 'assistant', text: 'Bonjour' });
    expect(state.sessions.find((s) => s.id === 'a')!.items).toEqual([]);
  });

  it('un outil coupe le texte : le texte suivant crée un nouveau message', () => {
    const state = run(
      [
        { type: 'text-delta', sessionId: 'b', text: 'Je lis.' },
        { type: 'tool-use', sessionId: 'b', name: 'Read', input: { file_path: 'x.ts' } },
        { type: 'text-delta', sessionId: 'b', text: 'Fini.' },
      ],
      twoSessions,
    );
    expect(state.sessions.find((s) => s.id === 'b')!.items).toEqual([
      { kind: 'assistant', text: 'Je lis.' },
      { kind: 'tool', name: 'Read', input: { file_path: 'x.ts' } },
      { kind: 'assistant', text: 'Fini.' },
    ]);
  });

  it('turn-end termine le tour', () => {
    const state = run(
      [
        { type: 'user-sent', sessionId: 'b', text: 'salut' },
        { type: 'turn-end', sessionId: 'b' },
      ],
      twoSessions,
    );
    expect(state.sessions.find((s) => s.id === 'b')!.status).toBe('idle');
  });

  it('un événement sur une session en arrière-plan la marque non lue ; la sélectionner efface', () => {
    // b est active (ouverte en dernier) : on écrit dans a.
    let state = run([{ type: 'text-delta', sessionId: 'a', text: 'coucou' }], twoSessions);
    expect(state.sessions.find((s) => s.id === 'a')!.unread).toBe(true);
    expect(state.sessions.find((s) => s.id === 'b')!.unread).toBe(false);

    state = sessionsReducer(state, { type: 'select', sessionId: 'a' });
    expect(state.activeId).toBe('a');
    expect(state.sessions.find((s) => s.id === 'a')!.unread).toBe(false);
  });

  it('une erreur s\'affiche et rend la main', () => {
    const state = run(
      [
        { type: 'user-sent', sessionId: 'b', text: 'salut' },
        { type: 'error', sessionId: 'b', message: 'claude s\'est arrêté' },
      ],
      twoSessions,
    );
    const b = state.sessions.find((s) => s.id === 'b')!;
    expect(b.items.at(-1)).toEqual({ kind: 'error', message: 'claude s\'est arrêté' });
    expect(b.status).toBe('idle');
  });

  it('fermer une session active passe à une autre', () => {
    const state = sessionsReducer(twoSessions, { type: 'session-closed', sessionId: 'b' });
    expect(state.sessions.map((s) => s.id)).toEqual(['a']);
    expect(state.activeId).toBe('a');
  });

  it('fermer une session en arrière-plan garde la session affichée', () => {
    const state = sessionsReducer(twoSessions, { type: 'session-closed', sessionId: 'a' });
    expect(state.sessions.map((s) => s.id)).toEqual(['b']);
    expect(state.activeId).toBe('b');
  });

  it('un titre trop long est coupé à 40 caractères', () => {
    const state = run([{ type: 'user-sent', sessionId: 'a', text: 'x'.repeat(100) }], twoSessions);
    expect(state.sessions[0].title).toHaveLength(40);
  });

  it('Stop note l\'arrêt dans la conversation ; turn-end rend la main', () => {
    const state = run(
      [
        { type: 'user-sent', sessionId: 'b', text: 'raconte' },
        { type: 'text-delta', sessionId: 'b', text: 'Il était' },
        { type: 'user-interrupted', sessionId: 'b' },
        { type: 'turn-end', sessionId: 'b' },
      ],
      twoSessions,
    );
    const b = state.sessions.find((s) => s.id === 'b')!;
    expect(b.items.at(-1)).toEqual({ kind: 'stopped' });
    expect(b.status).toBe('idle');
  });

  it('la liste des commandes est commune à l\'app et ne marque pas la session non lue', () => {
    const state = sessionsReducer(twoSessions, { type: 'commands', sessionId: 'a', names: ['aide-decision'] });
    expect(state.commands).toEqual(['aide-decision']);
    expect(state.sessions[0].unread).toBe(false);
  });

  it('ignore les événements d\'une session inconnue', () => {
    expect(sessionsReducer(twoSessions, { type: 'text-delta', sessionId: 'zzz', text: 'x' })).toBe(twoSessions);
  });

  it('rate-limits remplace les jauges globales (et efface la marque « en cache »)', () => {
    const cached = { ...twoSessions, limits: { fiveHour: { utilization: 0.1, resetsAt: 1 }, savedAt: 123 } };
    const state = sessionsReducer(cached, {
      type: 'rate-limits',
      sessionId: 'a',
      fiveHour: { utilization: 0.38, resetsAt: 2 },
      sevenDay: { utilization: 0.53, resetsAt: 3 },
    });
    expect(state.limits).toEqual({ fiveHour: { utilization: 0.38, resetsAt: 2 }, sevenDay: { utilization: 0.53, resetsAt: 3 } });
  });

  it('context et suggestion vont dans la session, sans la marquer non lue', () => {
    const state = run(
      [
        { type: 'context', sessionId: 'a', used: 32620, max: 1000000 },
        { type: 'suggestion', sessionId: 'a', text: 'écris le script' },
      ],
      twoSessions, // b est active, a ne l'est pas
    );
    const a = state.sessions.find((s) => s.id === 'a')!;
    expect(a.context).toEqual({ used: 32620, max: 1000000 });
    expect(a.suggestion).toBe('écris le script');
    expect(a.unread).toBe(false);
  });

  it('le modèle lu dans init va dans la session, sans la marquer non lue', () => {
    const state = run([{ type: 'model', sessionId: 'a', model: 'claude-sonnet-5-5' }], twoSessions);
    const a = state.sessions.find((s) => s.id === 'a')!;
    expect(a.activeModel).toBe('claude-sonnet-5-5');
    expect(a.unread).toBe(false);
  });

  it('envoyer un message efface la suggestion', () => {
    const state = run(
      [
        { type: 'suggestion', sessionId: 'b', text: 'écris le script' },
        { type: 'user-sent', sessionId: 'b', text: 'autre chose' },
      ],
      twoSessions,
    );
    expect(state.sessions.find((s) => s.id === 'b')!.suggestion).toBeUndefined();
  });
});
