import { describe, expect, it } from 'vitest';
import { addAttachments, canSend, droppedPaths, fileName, withAttachments } from '../src/shared/attachments';

describe('withAttachments', () => {
  it('sans fichier : le texte tel quel', () => {
    expect(withAttachments('bonjour', [])).toBe('bonjour');
  });

  it('ajoute les chemins après une ligne vide', () => {
    expect(withAttachments('décris', ['C:\\a.png', 'D:\\b.pdf'])).toBe('décris\n\nFichiers joints :\n- C:\\a.png\n- D:\\b.pdf');
  });

  it('sans texte : seulement la liste', () => {
    expect(withAttachments('  ', ['C:\\a.png'])).toBe('Fichiers joints :\n- C:\\a.png');
  });
});

describe('addAttachments', () => {
  it('ajoute à la fin sans doublon', () => {
    expect(addAttachments(['C:\\a.png'], ['C:\\b.png', 'C:\\a.png', 'C:\\b.png'])).toEqual(['C:\\a.png', 'C:\\b.png']);
  });
});

describe('canSend', () => {
  it('texte ou fichier suffit, rien du tout non', () => {
    expect(canSend('salut', [])).toBe(true);
    expect(canSend(' ', ['C:\\a.png'])).toBe(true);
    expect(canSend('  ', [])).toBe(false);
  });
});

describe('fileName', () => {
  it('garde le nom après le dernier séparateur', () => {
    expect(fileName('C:\\Users\\moi\\photo.jpg')).toBe('photo.jpg');
    expect(fileName('C:/x/y.pdf')).toBe('y.pdf');
  });
});

describe('droppedPaths', () => {
  it('garde le chemin de chaque fichier déposé, ignore ce qui n\'en a pas', () => {
    const paths: Record<string, string> = { a: 'C:\\a.png', b: '', c: 'C:\\c.pdf' };
    expect(droppedPaths(['a', 'b', 'c'], (f) => paths[f])).toEqual(['C:\\a.png', 'C:\\c.pdf']);
  });
});
