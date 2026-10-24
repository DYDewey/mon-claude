import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { savePastedImage } from '../src/main/attachment-store';

const roots: string[] = [];
const tempDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'attach-'));
  roots.push(root);
  return join(root, 'attachments'); // n'existe pas encore
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('attachment-store', () => {
  const now = new Date(2026, 9, 25, 1, 40, 7);
  const bytes = new Uint8Array([137, 80, 78, 71]);

  it('crée le dossier et écrit l\'image, nommée à la date', async () => {
    const dir = tempDir();
    const path = await savePastedImage(dir, bytes, 'png', now);
    expect(path).toBe(join(dir, '2026-10-25_01h40m07.png'));
    expect([...readFileSync(path)]).toEqual([...bytes]);
  });

  it('deux collages dans la même seconde ne s\'écrasent pas', async () => {
    const dir = tempDir();
    const first = await savePastedImage(dir, bytes, 'png', now);
    const second = await savePastedImage(dir, new Uint8Array([1]), 'png', now);
    expect(second).toBe(join(dir, '2026-10-25_01h40m07_2.png'));
    expect([...readFileSync(first)]).toEqual([...bytes]);
  });

  it('refuse une extension qui n\'est pas une image', async () => {
    await expect(savePastedImage(tempDir(), bytes, 'exe', now)).rejects.toThrow();
    await expect(savePastedImage(tempDir(), bytes, '../x', now)).rejects.toThrow();
  });
});
