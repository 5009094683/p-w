import { absoluteUrl } from '../data/site.ts';

export const OG_IMAGE = { width: 1200, height: 630, type: 'image/png' } as const;

/** Slug of the generated social image for a page path: `/` is `home`, `/projects/tgmoji` is `projects/tgmoji`. */
export function ogSlug(path: string): string {
  return path === '/' ? 'home' : path.replace(/^\//, '');
}

export function ogImagePath(path: string): string {
  return `/og/${ogSlug(path)}.png`;
}

export function ogImageUrl(path: string): string {
  return absoluteUrl(ogImagePath(path));
}

export const ROBOTS_INDEX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const ROBOTS_NOINDEX = 'noindex, follow';

/**
 * Serializes data for a `<script>` data block. `<` is escaped so that no string
 * inside the data can close the element early.
 */
export function serializeForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
