import { useEffect, useState } from 'react';
import type { LimitWindow } from '../../../shared/events';
import type { Limits } from '../state/sessions';
import { ago, level, percent, resetLabel } from '../usage-format';

export function UsageGauges({ limits }: { limits?: Limits }) {
  // Les libellés (« il y a 5 min », heure de reset) dépendent de l'heure : on rafraîchit chaque minute.
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!limits?.fiveHour && !limits?.sevenDay) {
    return <div className="gauges muted">Jauges : après la 1re réponse</div>;
  }
  return (
    <div className={limits.savedAt ? 'gauges stale' : 'gauges'}>
      {limits.fiveHour && <Gauge label="5 h" window={limits.fiveHour} now={now} />}
      {limits.sevenDay && <Gauge label="7 jours" window={limits.sevenDay} now={now} />}
      {limits.savedAt && <div className="gauge-note">{ago(limits.savedAt, now)}</div>}
    </div>
  );
}

function Gauge({ label, window: w, now }: { label: string; window: LimitWindow; now: number }) {
  return (
    <div className="gauge" title={`Remise à zéro : ${resetLabel(w.resetsAt, now)}`}>
      <div className="gauge-text">
        {label} : {percent(w.utilization)} % <span className="muted">· reset {resetLabel(w.resetsAt, now)}</span>
      </div>
      <div className="gauge-bar">
        <div className={`gauge-fill ${level(w.utilization)}`} style={{ width: `${Math.min(100, percent(w.utilization))}%` }} />
      </div>
    </div>
  );
}

/** « 23 % » coloré selon le remplissage du contexte de la session. */
export function ContextBadge({ context }: { context?: { used: number; max: number } }) {
  if (!context) return null;
  const ratio = context.used / context.max;
  return (
    <span className={`ctx ${level(ratio)}`} title={`${context.used.toLocaleString('fr-FR')} / ${context.max.toLocaleString('fr-FR')} tokens`}>
      {percent(ratio)} %
    </span>
  );
}
