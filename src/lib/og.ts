/**
 * Draws the 1200 by 630 social image for a page at build time.
 * Satori lays the card out and turns the text into outlines; sharp writes the PNG.
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { person } from '../data/profile.ts';
import { SITE } from '../data/site.ts';
import { BRAND, MONOGRAM } from './brand.ts';
import { OG_IMAGE } from './seo.ts';

const require = createRequire(join(process.cwd(), 'package.json'));
const packageFile = (specifier: string) => readFile(require.resolve(specifier));

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: { ...props, children: children.length === 1 ? children[0] : children },
});

let assets: Promise<{ fonts: Parameters<typeof satori>[1]['fonts']; portrait: string }> | undefined;

function loadAssets() {
  assets ??= (async () => {
    const [sans, sansMedium, serif, portrait] = await Promise.all([
      packageFile('@fontsource/geist/files/geist-latin-400-normal.woff'),
      packageFile('@fontsource/geist/files/geist-latin-500-normal.woff'),
      packageFile('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff'),
      sharp(join(process.cwd(), 'src/assets/avatar.png')).resize(288, 288).jpeg({ quality: 88 }).toBuffer(),
    ]);
    return {
      fonts: [
        { name: 'Geist', data: sans, weight: 400 as const, style: 'normal' as const },
        { name: 'Geist', data: sansMedium, weight: 500 as const, style: 'normal' as const },
        { name: 'Instrument Serif', data: serif, weight: 400 as const, style: 'normal' as const },
      ],
      portrait: `data:image/jpeg;base64,${portrait.toString('base64')}`,
    };
  })();
  return assets;
}

/** Long headlines step down in size so they stay within three lines. */
function titleSize(title: string): number {
  if (title.length <= 24) return 104;
  if (title.length <= 44) return 88;
  if (title.length <= 64) return 74;
  return 62;
}

export type OgCard = {
  kicker: string;
  title: string;
  /** A line of supporting text under the headline. */
  subtitle?: string;
  /** Site path, shown as the address on the card. */
  path: string;
};

export async function renderOgImage({ kicker, title, subtitle, path }: OgCard): Promise<Buffer> {
  const { fonts, portrait } = await loadAssets();
  const address = path === '/' || path === '/404' ? SITE.host : `${SITE.host}${path}`;

  const card = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BRAND.paper,
        color: BRAND.ink,
        fontFamily: 'Geist',
      },
    },
    h('div', {
      style: {
        height: 10,
        width: '100%',
        backgroundImage: `linear-gradient(90deg, ${BRAND.signature[0]}, ${BRAND.signature[1]} 50%, ${BRAND.signature[2]} 75%, ${BRAND.signature[3]})`,
      },
    }),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '56px 72px 60px' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center' } },
        h(
          'svg',
          { width: 44, height: 44, viewBox: MONOGRAM.viewBox },
          h('path', { d: MONOGRAM.path, fill: BRAND.ink }),
        ),
        h('div', { style: { marginLeft: 18, fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' } }, person.name),
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingRight: 40 } },
        h(
          'div',
          {
            style: {
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: BRAND.muted,
            },
          },
          kicker,
        ),
        h(
          'div',
          {
            style: {
              marginTop: 18,
              fontFamily: 'Instrument Serif',
              fontSize: titleSize(title),
              lineHeight: 1.02,
              letterSpacing: '-0.015em',
            },
          },
          title,
        ),
        ...(subtitle
          ? [
              h(
                'div',
                { style: { marginTop: 22, maxWidth: 900, fontSize: 32, lineHeight: 1.3, color: BRAND.muted } },
                subtitle,
              ),
            ]
          : []),
      ),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' } },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          h('div', { style: { fontSize: 26, color: BRAND.muted } }, person.role),
          h('div', { style: { marginTop: 6, fontSize: 26, fontWeight: 500 } }, address),
        ),
        h('img', {
          src: portrait,
          width: 132,
          height: 132,
          style: { borderRadius: 66, border: `4px solid ${BRAND.ink}` },
        }),
      ),
    ),
  );

  const svg = await satori(card as unknown as Parameters<typeof satori>[0], {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    fonts,
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
