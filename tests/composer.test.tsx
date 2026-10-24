import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AttachmentChips, Composer } from '../src/renderer/src/components/composer';

const noop = () => {};
const pickFiles = async () => [];
const render = (running: boolean, suggestion?: string) =>
  renderToStaticMarkup(
    <Composer running={running} onSend={noop} onStop={noop} onPickFiles={pickFiles} pathForFile={() => ''} onSavePasted={async () => ''} commands={[]} suggestion={suggestion} />,
  );

describe('AttachmentChips', () => {
  it('une étiquette par fichier, avec son nom et un bouton pour la retirer', () => {
    const html = renderToStaticMarkup(<AttachmentChips files={['C:\\x\\photo.jpg', 'C:\\y\\doc.pdf']} onRemove={noop} />);
    expect(html).toContain('photo.jpg');
    expect(html).toContain('doc.pdf');
    expect(html).toContain('title="C:\\x\\photo.jpg"');
    expect(html.match(/aria-label="Retirer/g)).toHaveLength(2);
  });

  it('aucun fichier : rien', () => {
    expect(renderToStaticMarkup(<AttachmentChips files={[]} onRemove={noop} />)).toBe('');
  });
});

describe('Composer', () => {
  it('montre la suggestion en gris dans la saisie vide, avec l\'astuce Tab', () => {
    expect(render(false, 'écris le script')).toContain('placeholder="écris le script   (Tab pour reprendre)"');
  });

  it('sans suggestion ou pendant une réponse : texte habituel', () => {
    expect(render(false)).toContain('placeholder="Écris ton message (Entrée pour envoyer)"');
    expect(render(true, 'écris le script')).toContain('placeholder="Claude répond…"');
  });

  it('a un bouton pour joindre des fichiers, grisé pendant une réponse', () => {
    expect(render(false)).toMatch(/<button[^>]*title="Joindre des fichiers"[^>]*>/);
    expect(render(true)).toMatch(/<button[^>]*disabled=""[^>]*title="Joindre des fichiers"/);
  });
});
