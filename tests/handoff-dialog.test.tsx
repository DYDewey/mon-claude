import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HandoffDialog, shouldCancel } from '../src/renderer/src/components/handoff-dialog';

const noop = () => {};

describe('HandoffDialog', () => {
  it('pré-remplit la zone de texte avec le résumé, avec les deux boutons', () => {
    const html = renderToStaticMarkup(<HandoffDialog initialText={'# Passation\n## Objectif'} busy={false} onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('<textarea');
    expect(html).toContain('# Passation\n## Objectif');
    expect(html).toContain('Annuler');
    expect(html).toContain('Ouvrir une session neuve');
    expect(html).not.toContain('disabled');
  });

  it('validation désactivée si le texte est vide ou pendant l\'enregistrement', () => {
    expect(renderToStaticMarkup(<HandoffDialog initialText="  " busy={false} onCancel={noop} onConfirm={noop} />)).toContain('disabled');
    expect(renderToStaticMarkup(<HandoffDialog initialText="x" busy onCancel={noop} onConfirm={noop} />)).toContain('disabled');
  });

  it("affiche l'erreur d'enregistrement", () => {
    const html = renderToStaticMarkup(<HandoffDialog initialText="x" busy={false} error="disque plein" onCancel={noop} onConfirm={noop} />);
    expect(html).toContain('disque plein');
  });
});

describe('shouldCancel', () => {
  it('Échap annule, sauf pendant l\'enregistrement', () => {
    expect(shouldCancel('Escape', false)).toBe(true);
    expect(shouldCancel('Escape', true)).toBe(false);
    expect(shouldCancel('Enter', false)).toBe(false);
  });

  it('boutons : Annuler secondaire, validation principale', () => {
    const html = renderToStaticMarkup(<HandoffDialog initialText="x" busy={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(html).toMatch(/<button class="btn-secondary"[^>]*>Annuler/);
    expect(html).toContain('aria-modal="true"');
  });
});
