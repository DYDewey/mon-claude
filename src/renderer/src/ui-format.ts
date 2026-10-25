/** Dernier dossier d'un chemin Windows ou POSIX (« mon-claude »), séparateur final ignoré. */
export function folderLabel(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}
