import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from '../src/renderer/src/components/message';

const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />);

describe('Markdown', () => {
  it('une liste devient une vraie liste', () => {
    expect(html('- un\n- deux')).toContain('<li>un</li>');
  });

  it('un bloc de code est coloré', () => {
    expect(html('```ts\nconst a = 1;\n```')).toContain('hljs-keyword');
  });

  it('les tableaux GFM sont rendus', () => {
    expect(html('| a | b |\n|---|---|\n| 1 | 2 |')).toContain('<table>');
  });

  it('le HTML brut n\'est jamais interprété', () => {
    expect(html('<img src=x onerror="alert(1)">')).not.toContain('<img');
  });
});
