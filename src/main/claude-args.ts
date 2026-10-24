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
    // On choisit nous-mêmes l'identifiant : on le connaît avant la première réponse.
    ...(resume ? ['--resume', sessionId] : ['--session-id', sessionId]),
  ];
}
