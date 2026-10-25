import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pathsExist } from '../src/main/paths-exist';

describe('pathsExist', () => {
  it('dit pour chaque chemin s il existe', () => {
    const dir = mkdtempSync(join(tmpdir(), 'paths-'));
    const file = join(dir, 'sujet.pdf');
    writeFileSync(file, '');
    expect(pathsExist([dir, file, join(dir, 'absent.pdf')])).toEqual([true, true, false]);
  });

  it('refuse ce qui n est pas une liste de textes', () => {
    expect(pathsExist('C:\\')).toEqual([]);
    expect(pathsExist([3, null, ''])).toEqual([false, false, false]);
  });
});
