// Un élément affiché dans le chat. Partagé : le main convertit aussi l'historique dans ce format.
export type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; input: Record<string, unknown> }
  | { kind: 'error'; message: string }
  | { kind: 'stopped' };
