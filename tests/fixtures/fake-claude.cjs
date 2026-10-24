// Faux CLI claude pour les tests : à chaque message reçu sur stdin, rejoue le flux capturé.
// Une requête de contrôle `interrupt` reçoit la même réponse que le vrai CLI (vérifiée le 24/10/2026).
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const readline = require('node:readline');

const stream = readFileSync(join(__dirname, 'stream-bonjour.jsonl'), 'utf8');
const out = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const msg = JSON.parse(line);
  if (msg.type === 'control_request' && msg.request?.subtype === 'interrupt') {
    out({ type: 'control_response', response: { subtype: 'success', request_id: msg.request_id, response: { still_queued: [] } } });
    out({ type: 'result', subtype: 'error_during_execution', is_error: true, total_cost_usd: 0 });
    return;
  }
  process.stdout.write(stream);
});
