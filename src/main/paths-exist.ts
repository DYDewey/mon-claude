import { existsSync } from 'node:fs';

/** Pour la fiche d'un projet : dossier ou fichiers disparus. Ce qui vient du renderer est vérifié. */
export function pathsExist(paths: unknown): boolean[] {
  if (!Array.isArray(paths)) return [];
  return paths.map((path) => typeof path === 'string' && path !== '' && existsSync(path));
}
