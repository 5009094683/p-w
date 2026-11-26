import lock from '../data/lastmod.json' with { type: 'json' };

export interface LastmodEntry {
  /** SHA-256 of the page's Markdown body: its visible content, without markup. */
  hash: string;
  /** Date that content last changed, as YYYY-MM-DD (UTC). */
  date: string;
}

/**
 * The lock records, for every page, a hash of what a reader sees and the date
 * that hash last changed. The sitemap and the structured data take their
 * modification dates from here, so a date moves only when the content does.
 * `pnpm lastmod` updates the file; a test fails the build if it is stale.
 */
export const lastmodLock = lock as Record<string, LastmodEntry>;

export function lastModified(path: string): string | undefined {
  return lastmodLock[path]?.date;
}
