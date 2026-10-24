import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ToolLine, toolTarget } from '../src/renderer/src/components/tool-line';

describe('toolTarget', () => {
  it('prend la cible principale selon l\'outil', () => {
    expect(toolTarget({ file_path: 'C:\\p\\a.ts', content: '...' })).toBe('C:\\p\\a.ts');
    expect(toolTarget({ command: 'npm test', description: 'tests' })).toBe('npm test');
    expect(toolTarget({ pattern: '**/*.ts' })).toBe('**/*.ts');
    expect(toolTarget({ url: 'https://exemple.fr' })).toBe('https://exemple.fr');
  });

  it('coupe une commande trop longue et ignore une entrée sans cible', () => {
    expect(toolTarget({ command: 'x'.repeat(200) })).toHaveLength(80);
    expect(toolTarget({ todos: [] })).toBe('');
  });
});

describe('ToolLine', () => {
  it('affiche nom + cible, et l\'entrée complète une fois dépliée', () => {
    const html = renderToStaticMarkup(<ToolLine name="Bash" input={{ command: 'npm test' }} />);
    expect(html).toContain('<details');
    expect(html).toContain('Bash');
    expect(html).toContain('npm test');
    expect(html).toContain('&quot;command&quot;');
  });
});
