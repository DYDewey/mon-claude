// Génère resources/icon.png (256×256) : un « C » blanc sur un carré arrondi orange.
// Sans dépendance : on calcule chaque pixel puis on écrit le PNG à la main (zlib).
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const SIZE = 256;
const SS = 4; // sous-échantillons par axe, pour lisser les bords
const BG = [0xd9, 0x77, 0x57]; // --accent de l'interface
const FG = [0xff, 0xff, 0xff];

// 0 : transparent, 1 : fond, 2 : lettre
function shape(x, y) {
  const r = 48; // rayon des coins
  const cx = Math.min(Math.max(x, r), SIZE - r);
  const cy = Math.min(Math.max(y, r), SIZE - r);
  if (Math.hypot(x - cx, y - cy) > r) return 0;
  const d = Math.hypot(x - 128, y - 128);
  const angle = Math.abs(Math.atan2(y - 128, x - 128)); // 0 à droite
  return d >= 52 && d <= 88 && angle > Math.PI / 4 ? 2 : 1;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filtre « aucun » pour la ligne
  for (let x = 0; x < SIZE; x++) {
    const count = [0, 0, 0];
    for (let sy = 0; sy < SS; sy++)
      for (let sx = 0; sx < SS; sx++) count[shape(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)]++;
    const opaque = count[1] + count[2];
    const i = y * (SIZE * 4 + 1) + 1 + x * 4;
    for (let c = 0; c < 3; c++) raw[i + c] = opaque ? Math.round((BG[c] * count[1] + FG[c] * count[2]) / opaque) : 0;
    raw[i + 3] = Math.round((255 * opaque) / (SS * SS));
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // 8 bits par canal
ihdr[9] = 6; // RVBA

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('resources', { recursive: true });
writeFileSync('resources/icon.png', png);
console.log(`resources/icon.png écrit (${png.length} octets)`);
