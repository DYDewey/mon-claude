const ICONS: Record<string, string> = {
  Read: '📖',
  Write: '✏️',
  Edit: '✏️',
  Bash: '💻',
  PowerShell: '💻',
  Grep: '🔍',
  Glob: '🔍',
  WebFetch: '🌐',
  WebSearch: '🌐',
  Skill: '🧩',
  Agent: '🤖',
};

// Champs qui désignent « sur quoi » l'outil agit, par ordre de préférence.
const TARGET_KEYS = ['file_path', 'path', 'command', 'pattern', 'url', 'query', 'skill', 'description'];
const TARGET_MAX = 80;

export function toolTarget(input: Record<string, unknown>): string {
  const key = TARGET_KEYS.find((k) => typeof input[k] === 'string');
  return key ? (input[key] as string).slice(0, TARGET_MAX) : '';
}

export function ToolLine({ name, input }: { name: string; input: Record<string, unknown> }) {
  return (
    <details className="msg msg-tool">
      <summary>
        {ICONS[name] ?? '🔧'} <strong>{name}</strong> <span className="tool-target">{toolTarget(input)}</span>
      </summary>
      <pre>{JSON.stringify(input, null, 2)}</pre>
    </details>
  );
}
