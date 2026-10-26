import type { ChatItem } from './chat-item';

// Recherche dans le contenu des anciennes conversations : fonctions pures, partagées entre main et renderer.

export const QUERY_MAX = 200;
const SNIPPET_LEN = 120;
const SNIPPET_BEFORE = 40;

/** Texte cherchable d'une session : index de l'élément affiché, texte d'origine et texte plié. */
export interface SearchText {
  index: number;
  text: string;
  folded: string;
}

export interface Snippet {
  before: string;
  /** Le mot trouvé, tel qu'écrit dans le message (à surligner). */
  match: string;
  after: string;
}

export interface SearchHit {
  folder: string;
  id: string;
  title: string;
  path?: string;
  lastAt: number;
  /** Nombre de messages qui contiennent au moins un des mots. */
  count: number;
  /** Index (dans les éléments de la session) du premier message trouvé. */
  focusIndex: number;
  snippet: Snippet;
}

/** Minuscules et sans accents : « Été » → « ete ». */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Requête acceptée par main : une chaîne d'au plus 200 caractères. */
export function validQuery(q: unknown): q is string {
  return typeof q === 'string' && q.length <= QUERY_MAX;
}

/** Mots pliés de la requête ; aucun si elle fait moins de 3 caractères (hors espaces). */
export function searchTerms(query: string): string[] {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return terms.join('').length >= 3 ? terms : [];
}

/** Messages user et assistant d'une session (pas les outils), avec leur index d'affichage. */
export function searchableTexts(items: ChatItem[]): SearchText[] {
  return items.flatMap((item, index) =>
    item.kind === 'user' || item.kind === 'assistant' ? [{ index, text: item.text, folded: fold(item.text) }] : [],
  );
}

/** Tous les mots doivent apparaître dans la session ; sinon null. `term` : mot trouvé dans le premier message. */
export function matchSession(
  texts: SearchText[],
  terms: string[],
): { count: number; first: number; term: string } | null {
  if (terms.length === 0) return null;
  const missing = new Set(terms);
  let count = 0;
  let first: { index: number; term: string } | undefined;
  for (const t of texts) {
    const found = terms.filter((term) => t.folded.includes(term));
    if (found.length === 0) continue;
    count++;
    first ??= { index: t.index, term: found[0] };
    for (const term of found) missing.delete(term);
  }
  return first && missing.size === 0 ? { count, first: first.index, term: first.term } : null;
}

/** Extrait d'environ 120 caractères autour du premier `term` (plié) dans `text`. */
export function snippet(text: string, term: string): Snippet {
  const flat = text.replace(/\s+/g, ' ');
  // Plie caractère par caractère pour retrouver la position dans le texte d'origine.
  let folded = '';
  const origin: number[] = [];
  for (let i = 0; i < flat.length; ) {
    const ch = String.fromCodePoint(flat.codePointAt(i)!);
    const f = fold(ch);
    for (let k = 0; k < f.length; k++) origin.push(i);
    folded += f;
    i += ch.length;
  }
  origin.push(flat.length);
  const at = folded.indexOf(term);
  if (at < 0) return { before: '', match: '', after: flat.slice(0, SNIPPET_LEN) };
  const start = origin[at];
  const end = origin[at + term.length];
  const from = Math.max(0, start - SNIPPET_BEFORE);
  const to = Math.min(flat.length, from + SNIPPET_LEN);
  return {
    before: (from > 0 ? '…' : '') + flat.slice(from, start),
    match: flat.slice(start, end),
    after: flat.slice(end, Math.max(end, to)) + (to < flat.length ? '…' : ''),
  };
}
