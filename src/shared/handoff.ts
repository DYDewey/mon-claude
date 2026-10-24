import type { ChatItem } from './chat-item';

// Modèle recopié du skill garde-contexte, pour ne pas dépendre de ce qui est installé dans ~/.claude.
const TEMPLATE = `# Passation — <sujet en 5 mots> — <JJ/MM/AAAA HHhMM>

## Objectif
<1-2 lignes : ce que l'utilisateur veut obtenir au final>

## Où on en est
<1 ligne : l'état exact au moment de la coupure>

## Contexte indispensable
- <stack, versions, environnement, contraintes>
- <préférences exprimées par l'utilisateur>

## Décisions
- <décision> — <pourquoi, en quelques mots>

## Fait
- <élément terminé et vérifié>

## Reste à faire
1. <prochaine action immédiate, assez précise pour être lancée sans question>

## Fichiers & commandes
- \`chemin/fichier\` — rôle
- \`commande\` — ce qu'elle fait

## Pièges
- <ce qui a échoué et pourquoi, à ne pas retenter>`;

/** Consigne envoyée à la session en cours pour qu'elle rédige sa passation. */
export function buildHandoffPrompt(): string {
  return [
    'Rédige une passation de cette session : une note de reprise qui permet à une session neuve, qui n\'a rien vu, de continuer le travail en lisant ce seul texte.',
    '- Garde : objectif, état réel, décisions et leur raison, ce qui reste, chemins exacts, commandes qui marchent, pièges qui peuvent revenir.',
    '- Jette : l\'historique de la discussion, les pistes abandonnées sans leçon, le code (cite chemin + fonction).',
    '- Ne note comme « Fait » que ce qui a été vérifié. N\'invente rien : écris « inconnu ».',
    '- 40 lignes max, puces courtes, aucune prose. N\'utilise aucun outil et n\'écris aucun fichier.',
    '- Réponds uniquement avec le Markdown, selon ce modèle :',
    '',
    TEMPLATE,
  ].join('\n');
}

/** Texte de la passation rédigée après `fromIndex`, ou null si le tour a échoué ou n'a rien produit. */
export function handoffResult(items: ChatItem[], fromIndex: number): string | null {
  const after = items.slice(fromIndex);
  if (after.some((item) => item.kind === 'error' || item.kind === 'stopped')) return null;
  const text = after
    .flatMap((item) => (item.kind === 'assistant' ? [item.text] : []))
    .join('\n')
    .trim();
  return text || null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Nom du fichier de passation : AAAA-MM-JJ_HHhMM_<6 car. de la session>.md, en heure locale. */
export function handoffFileName(date: Date, sessionId: string): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}_${pad(date.getHours())}h${pad(date.getMinutes())}_${sessionId.slice(0, 6)}.md`;
}
