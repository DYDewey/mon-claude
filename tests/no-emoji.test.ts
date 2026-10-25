import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = 'src/renderer/src';
const files = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => join(ROOT, f));
// Emojis + symboles Unicode utilisés autrefois comme icônes.
const ICON_CHARS = /\p{Extended_Pictographic}|[↻×✕●◌]/u;

describe('icônes', () => {
  it.each(files)("%s n'utilise ni emoji ni symbole comme icône", (file) => {
    const bad = readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('{/*'))
      .filter((line) => ICON_CHARS.test(line));
    expect(bad).toEqual([]);
  });
});
