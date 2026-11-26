/**
 * Renders icons to inline SVG at build time. Nothing is fetched or run in the
 * browser. Icon data is read from disk rather than imported, so the type
 * checker does not have to parse multi-megabyte JSON files.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { getIconData, iconToHTML, iconToSVG, replaceIDs } from '@iconify/utils';

type IconifyJSON = Parameters<typeof getIconData>[0];

const require = createRequire(join(process.cwd(), 'package.json'));
const collections = new Map<string, IconifyJSON>();

function collection(prefix: string): IconifyJSON {
  let data = collections.get(prefix);
  if (!data) {
    data = JSON.parse(readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), 'utf8')) as IconifyJSON;
    collections.set(prefix, data);
  }
  return data;
}

export interface IconOptions {
  /** CSS length for width and height. Defaults to 1em, so icons scale with text. */
  size?: string;
  class?: string;
  /** Accessible name. Icons without one are hidden from assistive technology. */
  label?: string;
}

/** `name` is `collection:icon`, for example `lucide:arrow-up-right`. */
export function renderIcon(name: string, options: IconOptions = {}): string {
  const [prefix, icon] = name.split(':');
  if (!prefix || !icon) throw new Error(`Icon name must be "collection:icon", got "${name}"`);
  const data = getIconData(collection(prefix), icon);
  if (!data) throw new Error(`Unknown icon "${name}"`);

  const size = options.size ?? '1em';
  const svg = iconToSVG(data, { height: size, width: size });
  const attributes: Record<string, string> = { ...svg.attributes, focusable: 'false' };
  if (options.class) attributes.class = options.class;
  if (options.label) {
    attributes.role = 'img';
    attributes['aria-label'] = options.label;
  } else {
    attributes['aria-hidden'] = 'true';
  }
  return iconToHTML(replaceIDs(svg.body), attributes);
}
