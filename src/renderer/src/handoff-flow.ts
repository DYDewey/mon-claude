import { handoffResult } from '../../shared/handoff';
import type { SessionState } from './state/sessions';

/** Passation demandée : la consigne a été envoyée à `sessionId`, sa réponse commence après `fromIndex`. */
export interface PendingHandoff {
  sessionId: string;
  fromIndex: number;
}

export type HandoffPhase =
  | { phase: 'none' }
  | { phase: 'writing' }
  | { phase: 'review'; text: string }
  | { phase: 'failed' };

// Déduit pendant le rendu à partir des messages : pas d'état en double à garder synchronisé.
export function handoffPhase(pending: PendingHandoff | null, session: SessionState): HandoffPhase {
  if (!pending || pending.sessionId !== session.id) return { phase: 'none' };
  if (session.status === 'running') return { phase: 'writing' };
  const text = handoffResult(session.items, pending.fromIndex);
  return text ? { phase: 'review', text } : { phase: 'failed' };
}
