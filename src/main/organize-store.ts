import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { emptyOrganize, parseOrganize, type OrganizeData } from '../shared/organize';

const FILE = 'organize.json';

/** Texte actuel du fichier, ou null s'il n'existe pas. */
async function readText(dir: string): Promise<string | null> {
  try {
    return await readFile(join(dir, FILE), 'utf8');
  } catch {
    return null;
  }
}

/** Favoris et noms ; vide si le fichier est absent ou illisible (il n'est pas écrasé avant d'être copié en .bak). */
export async function loadOrganize(dir: string): Promise<OrganizeData> {
  const text = await readText(dir);
  return (text !== null && parseOrganize(text)) || emptyOrganize();
}

export async function saveOrganize(dir: string, data: OrganizeData): Promise<void> {
  await mkdir(dir, { recursive: true });
  const path = join(dir, FILE);
  const current = await readText(dir);
  // Un fichier illisible est gardé de côté une fois, au cas où il faudrait le réparer à la main.
  if (current !== null && !parseOrganize(current)) await copyFile(path, `${path}.bak`);
  // Fichier temporaire puis rename : il reste toujours un organize.json complet, même si l'app plante.
  await writeFile(`${path}.tmp`, JSON.stringify(data, null, 2), 'utf8');
  await rename(`${path}.tmp`, path);
}
