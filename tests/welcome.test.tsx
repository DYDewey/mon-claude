import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Welcome } from '../src/renderer/src/components/welcome';

describe('Welcome', () => {
  it('logo « C », salutation et bouton principal « Nouvelle session »', () => {
    const html = renderToStaticMarkup(<Welcome onNew={() => {}} />);
    expect(html).toMatch(/class="logo"[^>]*>C</);
    expect(html).toContain('Bonjour, que fait-on ?');
    expect(html).toMatch(/<button[^>]*>.*Nouvelle session<\/button>/);
  });
});
