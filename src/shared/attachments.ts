// Pièces jointes : on transmet le chemin des fichiers, claude les ouvre lui-même avec Read.

export function withAttachments(text: string, paths: string[]): string {
  const trimmed = text.trim();
  if (paths.length === 0) return trimmed;
  const list = ['Fichiers joints :', ...paths.map((p) => `- ${p}`)].join('\n');
  return trimmed ? `${trimmed}\n\n${list}` : list;
}

/** Ajoute à la fin, sans doublon. */
export function addAttachments(current: string[], added: string[]): string[] {
  return [...new Set([...current, ...added])];
}

export function canSend(text: string, paths: string[]): boolean {
  return text.trim() !== '' || paths.length > 0;
}

export function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
