import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/renderer/src/styles.css', 'utf8');
// Les couleurs n'ont le droit d'exister que dans les blocs `:root { … }` (variables).
const outsideRoot = css.replace(/:root[^{]*\{[^}]*\}/g, '');

describe('styles.css', () => {
  it("n'écrit aucune couleur en dur hors des variables", () => {
    expect(outsideRoot.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b(?!-)/g)).toBeNull();
  });

  it('a un thème clair qui suit Windows', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: light\)\s*\{\s*:root/);
  });

  it('coupe les animations si Windows le demande', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('colore le code sans feuille highlight.js externe', () => {
    expect(css).toContain('.hljs-keyword');
    expect(readFileSync('src/renderer/src/main.tsx', 'utf8')).not.toContain('highlight.js/styles');
  });
});
