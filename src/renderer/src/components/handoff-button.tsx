import type { HandoffPhase } from '../handoff-flow';
import type { SessionState } from '../state/sessions';

export function HandoffButton({
  session,
  phase,
  onClick,
}: {
  session: SessionState;
  phase: HandoffPhase['phase'];
  onClick: () => void;
}) {
  const disabled = session.status === 'running' || session.items.length === 0;
  return (
    <span className="handoff">
      {phase === 'failed' && <span className="handoff-failed">⚠️ Passation impossible</span>}
      <button
        className="handoff-btn"
        disabled={disabled}
        onClick={onClick}
        title="Claude résume la session ; tu relis, puis une session neuve repart de ce résumé"
      >
        {phase === 'writing' ? '✍️ Passation en cours…' : '📝 Passation'}
      </button>
    </span>
  );
}
