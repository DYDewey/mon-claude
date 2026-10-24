import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { handoffFileName } from '../shared/handoff';

// Seulement lettres, chiffres et tirets : pas de `..` ni de séparateur de chemin.
const SAFE_ID = /^[A-Za-z0-9-]+$/;

/** Écrit la passation dans `dir` (créé si besoin) et renvoie le chemin du fichier. */
export async function saveHandoff(dir: string, text: string, sessionId: string, now: Date): Promise<string> {
  if (!SAFE_ID.test(sessionId)) throw new Error(`Session invalide : ${sessionId}`);
  if (!text.trim()) throw new Error('Passation vide');
  await mkdir(dir, { recursive: true });
  const path = join(dir, handoffFileName(now, sessionId));
  await writeFile(path, text, 'utf8');
  return path;
}
