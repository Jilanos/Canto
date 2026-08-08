/**
 * Generates the temporary PWA icons (item_001 scope: manifest + placeholder icons).
 *
 * They are drawn in pure Node and encoded as PNG here rather than committed as
 * binaries, so the mark can be tuned in one place and the repo stays text-only until
 * a designed icon replaces it.
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');

const BACKGROUND = [13, 17, 23, 255];
const KEY_WHITE = [242, 246, 255, 255];
const KEY_BLACK = [27, 34, 48, 255];
const ACCENT = [90, 214, 168, 255];

/** Draws the mark: three piano keys with a pitch trace curving above them. */
function drawIcon(size, safeInset) {
  const pixels = new Uint8Array(size * size * 4);
  const put = (x, y, colour) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (y * size + x) * 4;
    pixels[offset] = colour[0];
    pixels[offset + 1] = colour[1];
    pixels[offset + 2] = colour[2];
    pixels[offset + 3] = colour[3];
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) put(x, y, BACKGROUND);
  }

  // Keyboard block in the lower part of the safe area.
  const inset = Math.round(size * safeInset);
  const boardLeft = inset;
  const boardRight = size - inset;
  const boardTop = Math.round(size * 0.62);
  const boardBottom = size - inset;
  const boardWidth = boardRight - boardLeft;
  const whiteCount = 3;
  const whiteWidth = boardWidth / whiteCount;

  for (let index = 0; index < whiteCount; index += 1) {
    const left = Math.round(boardLeft + index * whiteWidth);
    const right = Math.round(boardLeft + (index + 1) * whiteWidth) - Math.max(1, Math.round(size * 0.008));
    for (let y = boardTop; y < boardBottom; y += 1) {
      for (let x = left; x < right; x += 1) put(x, y, KEY_WHITE);
    }
  }

  // Two black keys sitting on the boundaries between the white ones.
  const blackWidth = Math.round(whiteWidth * 0.5);
  const blackBottom = Math.round(boardTop + (boardBottom - boardTop) * 0.62);
  for (const boundary of [1, 2]) {
    const center = Math.round(boardLeft + boundary * whiteWidth);
    for (let y = boardTop; y < blackBottom; y += 1) {
      for (let x = center - blackWidth / 2; x < center + blackWidth / 2; x += 1) put(Math.round(x), y, KEY_BLACK);
    }
  }

  // Pitch trace: a rising then settling curve above the keys.
  const thickness = Math.max(2, Math.round(size * 0.045));
  for (let x = boardLeft; x < boardRight; x += 1) {
    const progress = (x - boardLeft) / boardWidth;
    const curve = Math.sin(progress * Math.PI * 1.15);
    const y = Math.round(size * 0.5 - curve * size * 0.22);
    for (let offset = -thickness / 2; offset <= thickness / 2; offset += 1) {
      put(x, Math.round(y + offset), ACCENT);
    }
  }

  return pixels;
}

function encodePng(size, pixels) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // Filter type 0: none.
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bit depth.
  ihdr[9] = 6; // Colour type: RGBA.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)) >>> 0;
  return (crc ^ 0xffffffff) >>> 0;
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, safeInset: 0.12 },
  { file: 'icon-512.png', size: 512, safeInset: 0.12 },
  // Maskable icons are cropped to a circle by the launcher, so keep the mark inside
  // the 80% safe zone.
  { file: 'maskable-512.png', size: 512, safeInset: 0.22 },
];

for (const target of targets) {
  const png = encodePng(target.size, drawIcon(target.size, target.safeInset));
  writeFileSync(resolve(OUT_DIR, target.file), png);
  console.log(`icons: wrote ${target.file} (${png.length} bytes)`);
}
