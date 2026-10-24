import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHistoryReader } from '../src/main/history-reader';

let root: string;

function session(dir: string, id: string, cwd: string, prompt: string, at: string) {
  const lines = [
    { type: 'user', message: { content: prompt }, timestamp: at, cwd },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'ok' }] }, timestamp: at, cwd },
  ];
  writeFileSync(join(root, dir, `${id}.jsonl`), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'history-'));
  mkdirSync(join(root, 'C--proj-a'));
  mkdirSync(join(root, 'C--proj-b'));
  mkdirSync(join(root, 'C--proj-a', 'memory')); // sous-dossier : ignoré
  writeFileSync(join(root, 'C--proj-a', 'memory', 'x.jsonl'), '');
  writeFileSync(join(root, 'C--proj-a', 'notes.txt'), 'pas une session');
  session('C--proj-a', 'a1', 'C:\\proj\\a', 'vieux', '2026-10-01T10:00:00Z');
  session('C--proj-a', 'a2', 'C:\\proj\\a', 'récent', '2026-10-03T10:00:00Z');
  session('C--proj-b', 'b1', 'C:\\proj\\b', 'milieu', '2026-10-02T10:00:00Z');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('createHistoryReader', () => {
  it('liste les projets par activité récente, sessions de la plus récente à la plus ancienne', async () => {
    const projects = await createHistoryReader(root).listProjects();
    expect(projects.map((p) => p.folder)).toEqual(['C--proj-a', 'C--proj-b']);
    expect(projects[0].path).toBe('C:\\proj\\a');
    expect(projects[0].sessions.map((s) => [s.id, s.title, s.messageCount])).toEqual([
      ['a2', 'récent', 2],
      ['a1', 'vieux', 2],
    ]);
    expect(projects[0].sessions[0].lastAt).toBe(Date.parse('2026-10-03T10:00:00Z'));
  });

  it('relit un fichier seulement si sa date de modification change', async () => {
    const file = join(root, 'C--proj-b', 'b1.jsonl');
    // Date ronde : utimes arrondit à la ms, ce qui changerait un mtime avec des décimales.
    const mtime = new Date('2026-10-02T12:00:00Z');
    utimesSync(file, mtime, mtime);
    const reader = createHistoryReader(root);
    await reader.listProjects();
    // Contenu changé mais même mtime → le cache sert encore.
    writeFileSync(file, JSON.stringify({ type: 'custom-title', customTitle: 'Nouveau' }) + '\n');
    utimesSync(file, mtime, mtime);
    const titleOfB = async () => (await reader.listProjects()).find((p) => p.folder === 'C--proj-b')?.sessions[0].title;
    expect(await titleOfB()).toBe('milieu');
    utimesSync(file, mtime, new Date(mtime.getTime() + 5000));
    expect(await titleOfB()).toBe('Nouveau');
  });

  it('readSession renvoie les messages', async () => {
    const items = await createHistoryReader(root).readSession('C--proj-b', 'b1');
    expect(items).toEqual([
      { kind: 'user', text: 'milieu' },
      { kind: 'assistant', text: 'ok' },
    ]);
  });

  it('refuse un chemin qui sort du dossier', async () => {
    const reader = createHistoryReader(root);
    await expect(reader.readSession('..', 'x')).rejects.toThrow();
    await expect(reader.readSession('C--proj-a', '..\\..\\secret')).rejects.toThrow();
    await expect(reader.readSession('C--proj-a/memory', 'x')).rejects.toThrow();
  });

  it('ne modifie aucun fichier', async () => {
    const file = join(root, 'C--proj-a', 'a1.jsonl');
    const before = statSync(file).mtimeMs;
    const reader = createHistoryReader(root);
    await reader.listProjects();
    await reader.readSession('C--proj-a', 'a1');
    expect(statSync(file).mtimeMs).toBe(before);
  });

  it('dossier racine absent : liste vide', async () => {
    expect(await createHistoryReader(join(root, 'absent')).listProjects()).toEqual([]);
  });
});
