import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ModelPicker } from '../src/renderer/src/components/model-picker';

const noop = () => {};

describe('ModelPicker', () => {
  it('propose « Par défaut » et les 3 modèles, avec le choix sélectionné', () => {
    const html = renderToStaticMarkup(<ModelPicker value="sonnet" disabled={false} onChange={noop} />);
    for (const label of ['Par défaut', 'Opus', 'Sonnet', 'Haiku']) expect(html).toContain(label);
    expect(html).toMatch(/<option value="sonnet" selected="">/);
    expect(html).not.toContain('disabled');
  });

  it('affiche le modèle réellement utilisé', () => {
    const html = renderToStaticMarkup(<ModelPicker activeModel="claude-sonnet-5-5" disabled={false} onChange={noop} />);
    expect(html).toContain('claude-sonnet-5-5');
  });

  it('grisé pendant une réponse', () => {
    expect(renderToStaticMarkup(<ModelPicker disabled onChange={noop} />)).toContain('disabled');
  });
});
