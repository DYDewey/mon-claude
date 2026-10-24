// Faux CLI claude pour les tests : à chaque ligne reçue sur stdin, rejoue le flux capturé.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const readline = require('node:readline');

const stream = readFileSync(join(__dirname, 'stream-bonjour.jsonl'), 'utf8');
readline.createInterface({ input: process.stdin }).on('line', () => process.stdout.write(stream));
