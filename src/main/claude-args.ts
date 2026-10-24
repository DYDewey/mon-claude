export interface ClaudeArgsOptions {
  sessionId: string;
  /** true : reprendre la session existante sessionId au lieu d'en créer une. */
  resume?: boolean;
}

export function buildClaudeArgs({ sessionId, resume }: ClaudeArgsOptions): string[] {
  return [
    '-p',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--permission-mode', 'acceptEdits',
    // Suggestion du prochain message après chaque tour (il faut aussi la variable d'env, cf. session-manager).
    '--prompt-suggestions', 'true',
    // On choisit nous-mêmes l'identifiant : on le connaît avant la première réponse.
    ...(resume ? ['--resume', sessionId] : ['--session-id', sessionId]),
  ];
}
