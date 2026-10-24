import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HandoffDialog } from '../src/renderer/src/components/handoff-dialog';

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
