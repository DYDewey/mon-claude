import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

const pad = (n: number) => String(n).padStart(2, '0');

/** Écrit une image collée dans `dir` (créé si besoin) et renvoie son chemin, pour la joindre au message. */
export async function savePastedImage(dir: string, bytes: Uint8Array, ext: string, now: Date): Promise<string> {
  if (!IMAGE_EXT.has(ext)) throw new Error(`Type d'image refusé : ${ext}`);
  await mkdir(dir, { recursive: true });
  const base =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}`;
  for (let n = 1; ; n++) {
    const path = join(dir, `${base}${n === 1 ? '' : `_${n}`}.${ext}`);
    try {
      await writeFile(path, bytes, { flag: 'wx' }); // 'wx' : échoue si le fichier existe déjà
      return path;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
    }
  }
}
