import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Composer } from '../src/renderer/src/components/composer';

const noop = () => {};
const render = (running: boolean, suggestion?: string) =>
  renderToStaticMarkup(<Composer running={running} onSend={noop} onStop={noop} commands={[]} suggestion={suggestion} />);

describe('Composer', () => {
  it('montre la suggestion en gris dans la saisie vide, avec l\'astuce Tab', () => {
    expect(render(false, 'écris le script')).toContain('placeholder="écris le script   (Tab pour reprendre)"');
  });

  it('sans suggestion ou pendant une réponse : texte habituel', () => {
    expect(render(false)).toContain('placeholder="Écris ton message (Entrée pour envoyer)"');
    expect(render(true, 'écris le script')).toContain('placeholder="Claude répond…"');
  });
});
