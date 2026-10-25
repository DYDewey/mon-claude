import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { menuKey, MODEL_OPTIONS, ModelPicker } from '../src/renderer/src/components/model-picker';

const noop = () => {};

describe('ModelPicker', () => {
  it('fermé : un bouton avec le choix en cours, sans liste', () => {
    const html = renderToStaticMarkup(<ModelPicker value="sonnet" disabled={false} onChange={noop} />);
    expect(html).toMatch(/<button[^>]*aria-haspopup="listbox"[^>]*aria-expanded="false"/);
    expect(html).toContain('Sonnet');
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain('disabled');
  });

  it('ouvert : « Par défaut » et les 3 modèles, le choix en cours coché, le modèle réel affiché', () => {
    const html = renderToStaticMarkup(
      <ModelPicker value="sonnet" activeModel="claude-sonnet-5-5" disabled={false} onChange={noop} initialOpen />,
    );
    expect(html).toContain('role="listbox"');
    for (const label of ['Par défaut', 'Opus', 'Sonnet', 'Haiku']) expect(html).toContain(label);
    expect(html).toMatch(/aria-selected="true"[^>]*>[^]*?Sonnet/);
    expect(html).toContain('claude-sonnet-5-5');
  });

  it('sans choix, affiche « Par défaut »', () => {
    expect(renderToStaticMarkup(<ModelPicker disabled={false} onChange={noop} />)).toContain('Par défaut');
  });

  it('grisé pendant une réponse', () => {
    expect(renderToStaticMarkup(<ModelPicker disabled onChange={noop} />)).toContain('disabled');
  });
});

describe('menuKey', () => {
  const n = MODEL_OPTIONS.length;

  it('flèche bas ouvre, puis descend en boucle', () => {
    expect(menuKey({ open: false, index: 0 }, 'ArrowDown', n)).toEqual({ open: true, index: 0 });
    expect(menuKey({ open: true, index: 1 }, 'ArrowDown', n)).toEqual({ open: true, index: 2 });
    expect(menuKey({ open: true, index: n - 1 }, 'ArrowDown', n)).toEqual({ open: true, index: 0 });
  });

  it('flèche haut remonte en boucle', () => {
    expect(menuKey({ open: true, index: 0 }, 'ArrowUp', n)).toEqual({ open: true, index: n - 1 });
  });

  it('Entrée choisit et ferme', () => {
    expect(menuKey({ open: true, index: 2 }, 'Enter', n)).toEqual({ open: false, index: 2, choose: true });
  });

  it('Échap ferme sans choisir', () => {
    expect(menuKey({ open: true, index: 2 }, 'Escape', n)).toEqual({ open: false, index: 2 });
  });

  it('les autres touches sont laissées au navigateur (null)', () => {
    expect(menuKey({ open: true, index: 1 }, 'a', n)).toBeNull();
  });

  // Menu fermé : Tab doit quitter le bouton, Entrée/Espace doivent l'ouvrir par un clic normal.
  it('menu fermé : Tab, Entrée, Espace et Échap sont laissés au navigateur', () => {
    for (const key of ['Tab', 'Enter', ' ', 'Escape']) {
      expect(menuKey({ open: false, index: 0 }, key, n)).toBeNull();
    }
  });
});
