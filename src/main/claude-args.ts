import type { ModelChoice } from '../shared/model';

export interface ClaudeArgsOptions {
  sessionId: string;
  /** true : reprendre la session existante sessionId au lieu d'en créer une. */
  resume?: boolean;
  /** Absent : « Par défaut », le réglage de Claude Code s'applique. */
  model?: ModelChoice;
  /** Instructions et fichiers du projet du dossier (cf. projects.ts). */
  appendSystemPrompt?: string;
}

export function buildClaudeArgs({ sessionId, resume, model, appendSystemPrompt }: ClaudeArgsOptions): string[] {
  return [
    '-p',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--permission-mode', 'acceptEdits',
    // Suggestion du prochain message après chaque tour (il faut aussi la variable d'env, cf. session-manager).
    '--prompt-suggestions', 'true',
    ...(model ? ['--model', model] : []),
    ...(appendSystemPrompt ? ['--append-system-prompt', appendSystemPrompt] : []),
    // On choisit nous-mêmes l'identifiant : on le connaît avant la première réponse.
    ...(resume ? ['--resume', sessionId] : ['--session-id', sessionId]),
  ];
}
