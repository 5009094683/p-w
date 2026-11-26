/**
 * Draws the site icons from the monogram and writes them to public/.
 * Run it again only if the monogram or the brand colors change:
 *
 *   pnpm icons
 */
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { BRAND, MONOGRAM } from '../src/lib/brand.ts';

const OUT = new URL('../public/', import.meta.url);
const [boxX = 0, boxY = 0, boxSize = 1] = MONOGRAM.viewBox.split(' ').map(Number);

/**
 * The monogram on a yellow tile.
 * @param radius corner radius as a fraction of the size (0 for a full-bleed square)
 * @param glyph  glyph size as a fraction of the tile
 */
function tile(size: number, radius: number, glyph: number): string {
  const scale = (size * glyph) / boxSize;
  const offset = (size * (1 - glyph)) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${BRAND.accent}"/>`,
    `<path transform="translate(${offset} ${offset}) scale(${scale}) translate(${-boxX} ${-boxY})" fill="${BRAND.ink}" d="${MONOGRAM.path}"/>`,
    '</svg>',
  ].join('');
}

const png = (svg: string, size: number) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Wraps PNG images in an ICO container, which is all a modern .ico file is. */
function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

const rounded = tile(64, 0.22, 0.58);
// Home-screen icons are masked by the system, so they fill the square and keep the glyph in the safe zone.
const fullBleed = (size: number) => tile(size, 0, 0.5);

await writeFile(new URL('favicon.svg', OUT), `${rounded}\n`);
await writeFile(
  new URL('favicon.ico', OUT),
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))),
);
await writeFile(new URL('apple-touch-icon.png', OUT), await png(fullBleed(180), 180));
await writeFile(new URL('icon-192.png', OUT), await png(fullBleed(192), 192));
await writeFile(new URL('icon-512.png', OUT), await png(fullBleed(512), 512));

console.log('Icons written to public/: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png');
