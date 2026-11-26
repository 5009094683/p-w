/**
 * The sitemap must list exactly the pages search engines should index, and its
 * dates must be true: a date moves only when a page's content changes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LastmodEntry } from '../src/lib/lastmod.ts';
import { contentHash, splitTwin } from '../src/lib/twin.ts';
import { ROOT, Site, canonicalOf } from './helpers.ts';

const site = new Site();
const xml = site.read('/sitemap.xml');
const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((match) => ({
  loc: match[1]!,
  lastmod: match[2]!,
}));
const lock = JSON.parse(readFileSync(join(ROOT, 'src/data/lastmod.json'), 'utf8')) as Record<string, LastmodEntry>;
const twinOf = (path: string) => site.read(path === '/' ? '/index.md' : `${path}.md`);

describe('sitemap.xml', () => {
  it('is well-formed', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(entries.length).toBe([...xml.matchAll(/<url>/g)].length);
  });

  it('lists exactly the indexable pages, by their canonical address', () => {
    expect(entries.map((entry) => entry.loc).sort()).toEqual(site.indexable.map((page) => page.canonical!).sort());
  });

  it('leaves out the error page and anything marked noindex', () => {
    const listed = new Set(entries.map((entry) => entry.loc));
    for (const page of site.pages.filter((item) => item.noindex)) {
      expect(listed.has(canonicalOf(page.path)), page.path).toBe(false);
    }
  });

  it('dates every page with a real day that is not in the future', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const entry of entries) {
      expect(entry.lastmod, entry.loc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.lastmod)), entry.loc).toBe(false);
      expect(entry.lastmod <= today, `${entry.loc} is dated ${entry.lastmod}`).toBe(true);
    }
  });

  it('includes the portrait for the pages about him', () => {
    expect(xml).toContain('<image:loc>https://yesbhautik.co.in/avatar.png</image:loc>');
  });
});

describe('the modification-date lock', () => {
  it('covers exactly the indexable pages', () => {
    expect(Object.keys(lock).sort(), 'run "pnpm lastmod" and commit src/data/lastmod.json').toEqual(
      site.indexable.map((page) => page.path).sort(),
    );
  });

  it('matches the content of every page (run "pnpm lastmod" after changing content)', () => {
    const stale = site.indexable
      .filter((page) => lock[page.path]?.hash !== contentHash(splitTwin(twinOf(page.path)).body))
      .map((page) => page.path);
    expect(stale).toEqual([]);
  });

  it('is the source of every date in the sitemap', () => {
    for (const entry of entries) {
      expect(entry.lastmod, entry.loc).toBe(lock[new URL(entry.loc).pathname]?.date);
    }
  });

  it('feeds the same dates to the structured data', () => {
    for (const page of site.indexable) {
      const block = page.jsonLd[0] as { '@graph': { '@id'?: string; dateModified?: string }[] };
      const node = block['@graph'].find((item) => item['@id'] === `${canonicalOf(page.path)}#webpage`);
      // Articles carry their own dates; every other page takes its date from the lock.
      if (page.path.startsWith('/posts/')) continue;
      expect(node?.dateModified, page.path).toBe(lock[page.path]?.date);
    }
  });
});

describe('robots.txt', () => {
  const robots = site.read('/robots.txt');

  it('allows everything and blocks nothing', () => {
    expect(robots).toMatch(/User-agent: \*\n(?:.*\n)*?Allow: \//);
    expect(robots).not.toMatch(/^Disallow:\s*\S/m);
  });

  it('points to the sitemap on the production domain', () => {
    expect(robots).toContain('Sitemap: https://yesbhautik.co.in/sitemap.xml');
  });

  it('states the content signals for search and AI use', () => {
    expect(robots).toContain('Content-Signal: search=yes, ai-input=yes, ai-train=yes');
  });

  it('names the main search and AI crawlers', () => {
    for (const agent of ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
      expect(robots, agent).toContain(`User-agent: ${agent}\n`);
    }
  });
});
