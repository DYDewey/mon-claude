import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RenameButton, RenameField, renameKey } from '../src/renderer/src/components/rename-field';

const noop = () => {};

describe('renameKey', () => {
  it('Entrée valide, Échap annule, le reste est laissé à la saisie', () => {
    expect(renameKey('Enter')).toBe('save');
    expect(renameKey('Escape')).toBe('cancel');
    expect(renameKey('a')).toBeNull();
    expect(renameKey('Tab')).toBeNull();
  });
});

describe('RenameField', () => {
  it('champ prérempli avec le titre affiché', () => {
    const html = renderToStaticMarkup(<RenameField initial="Promesses JS" onSave={noop} onCancel={noop} />);
    expect(html).toContain('value="Promesses JS"');
    expect(html).toContain('aria-label="Nouveau nom"');
  });
});

describe('RenameButton', () => {
  it('bouton-icône accessible', () => {
    const html = renderToStaticMarkup(<RenameButton onClick={noop} />);
    expect(html).toContain('aria-label="Renommer"');
    expect(html).toContain('<svg');
  });
});
