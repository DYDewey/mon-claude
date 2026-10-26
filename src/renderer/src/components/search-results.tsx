import { useEffect, useState } from 'react';
import { displayTitle, sessionKey, type OrganizeData } from '../../../shared/organize';
import { searchTerms, type SearchHit } from '../../../shared/search';
import { folderLabel } from '../ui-format';

const DELAY_MS = 300;

type Search = (query: string) => Promise<SearchHit[]>;

/**
 * Recherche dans le contenu, 300 ms après la dernière frappe. Renvoie null si la requête est trop courte,
 * 'loading' tant qu'aucune réponse n'est arrivée, sinon les derniers résultats reçus.
 * Une nouvelle frappe annule l'attente et fait ignorer la réponse en retard.
 */
export function useContentSearch(query: string, search: Search): SearchHit[] | 'loading' | null {
  const [result, setResult] = useState<{ query: string; hits: SearchHit[] } | null>(null);
  const active = searchTerms(query).length > 0;
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      search(query).then(
        (hits) => {
          if (!cancelled) setResult({ query, hits });
        },
        () => {
          if (!cancelled) setResult({ query, hits: [] });
        },
      );
    }, DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, active, search]);
  if (!active) return null;
  // Pendant qu'on tape, on garde les résultats précédents plutôt que de faire clignoter « Recherche… »,
  // sauf un « Rien trouvé » qui concernait une autre requête.
  return result && (result.query === query || result.hits.length > 0) ? result.hits : 'loading';
}

interface Props {
  results: SearchHit[] | 'loading' | null;
  organize: OrganizeData;
  onOpen: (folder: string, id: string, focusIndex: number) => void;
}

/** Section « Dans les conversations » sous l'historique filtré. */
export function SearchResults({ results, organize, onOpen }: Props) {
  if (results === null) return null;
  return (
    <div className="search-results">
      <div className="history-head"><span>Dans les conversations</span></div>
      {results === 'loading' ? (
        <p className="muted no-result">Recherche…</p>
      ) : results.length === 0 ? (
        <p className="muted no-result">Rien trouvé dans les conversations</p>
      ) : (
        <ul>
          {results.map((hit) => {
            const title = displayTitle(hit, organize.sessions[sessionKey(hit.folder, hit.id)]);
            return (
              <li key={`${hit.folder}/${hit.id}`} onClick={() => onOpen(hit.folder, hit.id, hit.focusIndex)} title={title}>
                <span className="search-hit-head">
                  <span className="sidebar-title">{title}</span>
                  <span className="muted search-hit-count">{hit.count > 1 ? `${hit.count} messages` : '1 message'}</span>
                </span>
                <span className="muted search-hit-project">{hit.path ? folderLabel(hit.path) : hit.folder}</span>
                <span className="search-snippet">
                  {hit.snippet.before}
                  <mark>{hit.snippet.match}</mark>
                  {hit.snippet.after}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
