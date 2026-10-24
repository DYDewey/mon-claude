// Calculs d'affichage des jauges, purs (le « maintenant » est passé en paramètre) pour être testés.

export type Level = 'ok' | 'warn' | 'danger';

/** Part de 0 à 1 → pourcentage entier. */
export function percent(ratio: number): number {
  return Math.round(ratio * 100);
}

export function level(ratio: number): Level {
  if (ratio >= 0.9) return 'danger';
  if (ratio >= 0.7) return 'warn';
  return 'ok';
}

const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Heure de remise à zéro : « 16h00 » aujourd'hui, sinon « mar. 09h05 ». */
export function resetLabel(resetsAtSec: number, now: number): string {
  const d = new Date(resetsAtSec * 1000);
  const time = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  return d.toDateString() === new Date(now).toDateString() ? time : `${DAYS[d.getDay()]} ${time}`;
}

export function ago(savedAt: number, now: number): string {
  const min = Math.floor((now - savedAt) / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.floor(h / 24)} j`;
}
