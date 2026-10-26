import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSearchIndex } from '../src/main/search-index';

let root: string;

function session(dir: string, id: string, texts: string[], at: string) {
  const lines = texts.map((t, i) =>
    i % 2 === 0
      ? { type: 'user', message: { content: t }, timestamp: at, cwd: `C:\\${dir}` }
      : { type: 'assistant', message: { content: [{ type: 'text', text: t }] }, timestamp: at },
  );
  writeFileSync(join(root, dir, `${id}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
}

/** Lecteur qui compte les lectures. */
function counting(fail?: string) {
  const reads: string[] = [];
  const read = async (file: string) => {
    reads.push(file);
    if (fail && file.endsWith(fail)) throw new Error('illisible');
    return readFile(file, 'utf8');
  };
  return { reads, read };
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'search-'));
  mkdirSync(join(root, 'proj-a'));
  mkdirSync(join(root, 'proj-b'));
  session('proj-a', 'vieux', ['Parle-moi de useEffect', 'Le cleanup de useEffect…', 'merci'], '2026-10-01T10:00:00Z');
  session('proj-a', 'recent', ['Électron et React', 'ok'], '2026-10-03T10:00:00Z');
  session('proj-b', 'autre', ['react hooks', 'voilà'], '2026-10-02T10:00:00Z');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('createSearchIndex', () => {
  it('trouve par le contenu, du plus récent au plus ancien', async () => {
    const { search } = createSearchIndex(root);
    const hits = await search('react');
    expect(hits.map((h) => h.id)).toEqual(['recent', 'autre']);
    expect(hits[0]).toMatchObject({ folder: 'proj-a', title: 'Électron et React', path: 'C:\\proj-a', count: 1, focusIndex: 0 });
    expect(hits[0].snippet.match).toBe('React');
  });

  it('tous les mots requis, accents ignorés', async () => {
    const { search } = createSearchIndex(root);
    expect((await search('electron react')).map((h) => h.id)).toEqual(['recent']);
    expect((await search('useeffect cleanup'))[0]).toMatchObject({ id: 'vieux', count: 2, focusIndex: 0 });
  });

  it('moins de 3 caractères : rien, sans lire', async () => {
    const { reads, read } = counting();
    expect(await createSearchIndex(root, read).search('re')).toEqual([]);
    expect(reads).toEqual([]);
  });

  it('2e recherche sans relire ; fichier modifié relu', async () => {
    const { reads, read } = counting();
    const { search } = createSearchIndex(root, read);
    await search('react');
    expect(reads).toHaveLength(3);
    await search('merci');
    expect(reads).toHaveLength(3);
    session('proj-b', 'autre', ['react hooks', 'merci beaucoup pour tout'], '2026-10-02T10:00:00Z');
    expect((await search('merci')).map((h) => h.id)).toEqual(['autre', 'vieux']);
    expect(reads).toHaveLength(4);
  });

  it('fichier illisible : sauté sans bloquer les autres', async () => {
    const { read } = counting('recent.jsonl');
    expect((await createSearchIndex(root, read).search('react')).map((h) => h.id)).toEqual(['autre']);
  });

  it('dossier absent : rien', async () => {
    expect(await createSearchIndex(join(root, 'absent')).search('react')).toEqual([]);
  });

  it('ne modifie aucun fichier', async () => {
    const file = join(root, 'proj-a', 'vieux.jsonl');
    const before = { text: readFileSync(file, 'utf8'), mtime: statSync(file).mtimeMs };
    await createSearchIndex(root).search('useeffect');
    expect({ text: readFileSync(file, 'utf8'), mtime: statSync(file).mtimeMs }).toEqual(before);
  });

  it('au plus 50 résultats', async () => {
    for (let i = 0; i < 55; i++) session('proj-b', `s${i}`, ['react'], '2026-09-01T10:00:00Z');
    expect(await createSearchIndex(root).search('react')).toHaveLength(50);
  });
});
