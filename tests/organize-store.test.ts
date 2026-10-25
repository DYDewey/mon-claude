import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadOrganize, saveOrganize } from '../src/main/organize-store';
import { emptyOrganize, toggleFavorite } from '../src/shared/organize';

const roots: string[] = [];
const tempDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'organize-'));
  roots.push(root);
  return join(root, 'userData'); // n'existe pas encore
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('organize-store', () => {
  it('fichier absent → données vides', async () => {
    expect(await loadOrganize(tempDir())).toEqual(emptyOrganize());
  });

  it('aller-retour, dossier créé, aucun .tmp restant', async () => {
    const dir = tempDir();
    const data = toggleFavorite(emptyOrganize(), 'a/s1');
    await saveOrganize(dir, data);
    expect(await loadOrganize(dir)).toEqual(data);
    expect(readdirSync(dir)).toEqual(['organize.json']);
  });

  it('fichier corrompu → vide, puis copié en .bak avant d’être remplacé', async () => {
    const dir = tempDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'organize.json'), '{cassé');
    expect(await loadOrganize(dir)).toEqual(emptyOrganize());

    await saveOrganize(dir, toggleFavorite(emptyOrganize(), 'a/s1'));
    expect(readFileSync(join(dir, 'organize.json.bak'), 'utf8')).toBe('{cassé');

    // La sauvegarde suivante ne remplace pas le .bak : le fichier actuel est valide.
    await saveOrganize(dir, emptyOrganize());
    expect(readFileSync(join(dir, 'organize.json.bak'), 'utf8')).toBe('{cassé');
  });

  it('écritures lancées en même temps → faites l’une après l’autre, la dernière gagne', async () => {
    const dir = tempDir();
    const datas = ['a/s1', 'a/s2', 'a/s3'].map((key) => toggleFavorite(emptyOrganize(), key));
    await Promise.all(datas.map((data) => saveOrganize(dir, data)));
    expect(await loadOrganize(dir)).toEqual(datas[2]);
    expect(readdirSync(dir)).toEqual(['organize.json']);
  });

  it('fichier valide → pas de .bak', async () => {
    const dir = tempDir();
    await saveOrganize(dir, emptyOrganize());
    await saveOrganize(dir, emptyOrganize());
    expect(existsSync(join(dir, 'organize.json.bak'))).toBe(false);
  });
});
