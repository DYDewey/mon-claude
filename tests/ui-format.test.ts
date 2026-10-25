import { describe, expect, it } from 'vitest';
import { folderLabel } from '../src/renderer/src/ui-format';

describe('folderLabel', () => {
  it('garde le dernier dossier du chemin', () => {
    expect(folderLabel('C:\\Users\\moi\\Documents\\mon-claude')).toBe('mon-claude');
    expect(folderLabel('D:/Cours/maths')).toBe('maths');
  });

  it('ignore le séparateur final', () => {
    expect(folderLabel('C:\\proj\\')).toBe('proj');
  });

  it('renvoie la racine telle quelle', () => {
    expect(folderLabel('C:\\')).toBe('C:');
  });
});
