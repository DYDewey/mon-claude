import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { saveHandoff } from '../src/main/handoff-store';

const roots: string[] = [];
const tempDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'handoff-'));
  roots.push(root);
  return join(root, 'handoffs'); // n'existe pas encore
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('handoff-store', () => {
  const now = new Date(2026, 9, 24, 15, 25);

  it('crée le dossier et écrit le texte tel quel', async () => {
    const dir = tempDir();
    const text = '# Passation — test — 24/10/2026\n\n## Objectif\nÉcrire « é » ✅\n';
    const path = await saveHandoff(dir, text, '6f0f87ab-cd', now);
    expect(path).toBe(join(dir, '2026-10-24_15h25_6f0f87.md'));
    expect(readFileSync(path, 'utf8')).toBe(text);
  });

  it('refuse un identifiant de session dangereux', async () => {
    const dir = tempDir();
    await expect(saveHandoff(dir, 'x', '../x', now)).rejects.toThrow();
    await expect(saveHandoff(dir, 'x', 'a/b\\c', now)).rejects.toThrow();
  });

  it('refuse un texte vide', async () => {
    await expect(saveHandoff(tempDir(), '  \n', 'abc', now)).rejects.toThrow();
  });
});
