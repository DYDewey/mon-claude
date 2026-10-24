import { describe, expect, it } from 'vitest';
import { ago, level, percent, resetLabel } from '../src/renderer/src/usage-format';

// Dates en heure locale : les tests marchent quel que soit le fuseau.
const now = new Date(2026, 9, 24, 14, 30).getTime(); // samedi 24/10/2026 14h30
const sec = (d: Date) => d.getTime() / 1000;

describe('usage-format', () => {
  it('percent arrondit une part (0 à 1) en pourcentage', () => {
    expect(percent(0.04)).toBe(4);
    expect(percent(0.535)).toBe(54);
    expect(percent(32620 / 1000000)).toBe(3);
  });

  it('level : vert < 70 %, orange 70–90 %, rouge ≥ 90 %', () => {
    expect(level(0.69)).toBe('ok');
    expect(level(0.7)).toBe('warn');
    expect(level(0.89)).toBe('warn');
    expect(level(0.9)).toBe('danger');
  });

  it('resetLabel : heure seule le jour même, sinon jour abrégé + heure', () => {
    expect(resetLabel(sec(new Date(2026, 9, 24, 16, 0)), now)).toBe('16h00');
    expect(resetLabel(sec(new Date(2026, 9, 27, 9, 5)), now)).toBe('mar. 09h05');
  });

  it('ago : durée depuis la sauvegarde', () => {
    expect(ago(now - 20_000, now)).toBe("à l'instant");
    expect(ago(now - 5 * 60_000, now)).toBe('il y a 5 min');
    expect(ago(now - 2 * 3_600_000, now)).toBe('il y a 2 h');
    expect(ago(now - 3 * 86_400_000, now)).toBe('il y a 3 j');
  });
});
