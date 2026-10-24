import { useEffect, useRef } from 'react';

/** Commandes proposées pour la saisie : rien si elle ne commence pas par « / » ou contient déjà un espace. */
export function matchCommands(text: string, commands: string[]): string[] {
  if (!text.startsWith('/') || /\s/.test(text)) return [];
  const query = text.slice(1).toLowerCase();
  const starts = commands.filter((c) => c.toLowerCase().startsWith(query));
  // « /pa » doit trouver « anthropic-skills:passation » : on teste aussi le nom après le préfixe du plugin.
  const others = commands.filter((c) => !starts.includes(c) && c.toLowerCase().includes(query));
  const afterPrefix = others.filter((c) => c.split(':').pop()!.toLowerCase().startsWith(query));
  const rest = others.filter((c) => !afterPrefix.includes(c));
  return [...starts, ...afterPrefix, ...rest];
}

interface Props {
  items: string[];
  selected: number;
  onPick: (name: string) => void;
}

export function SlashMenu({ items, selected, onPick }: Props) {
  const list = useRef<HTMLUListElement>(null);

  // Garde la ligne choisie visible quand on descend avec les flèches.
  useEffect(() => {
    list.current?.children[selected]?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <ul className="slash-menu" ref={list}>
      {items.map((name, i) => (
        <li
          key={name}
          className={i === selected ? 'selected' : undefined}
          // mousedown plutôt que click : la zone de saisie garde le focus.
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(name);
          }}
        >
          /{name}
        </li>
      ))}
    </ul>
  );
}
