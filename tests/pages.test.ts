/**
 * Search basics, checked on every built page: one title, one description, one
 * h1, a canonical address in the right form, a working social image.
 */
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { SITE } from '../src/data/site.ts';
import { Site, canonicalOf } from './helpers.ts';

const site = new Site();
const pages = site.pages;
const indexable = site.indexable;

describe('the set of pages', () => {
  it('includes every page the site is meant to have', () => {
    const paths = pages.map((page) => page.path);
    for (const path of ['/', '/about', '/services', '/projects', '/speaking', '/contact', '/press', '/uses', '/posts', '/404']) {
      expect(paths, `${path} was not built`).toContain(path);
    }
    expect(paths.filter((path) => path.startsWith('/projects/')).length).toBeGreaterThanOrEqual(10);
  });

  it('keeps the error page and an empty writing page out of search results', () => {
    expect(site.page('/404').noindex).toBe(true);
    const posts = site.page('/posts');
    const hasArticles = pages.some((page) => page.path.startsWith('/posts/'));
    expect(posts.noindex, 'the writing index is indexable exactly when it lists an article').toBe(!hasArticles);
  });

  it('lets every other page be indexed with full previews', () => {
    for (const page of pages.filter((item) => !['/404', '/posts'].includes(item.path))) {
      expect(page.robots, page.path).toContain('index, follow');
      expect(page.robots, page.path).toContain('max-image-preview:large');
    }
  });
});

describe.each(pages.map((page) => [page.path, page] as const))('%s', (_path, page) => {
  it('declares its language, character set and viewport', () => {
    expect(page.root.querySelector('html')?.getAttribute('lang')).toBe(SITE.language);
    expect(page.root.querySelector('meta[charset]')?.getAttribute('charset')).toBe('utf-8');
    expect(page.root.querySelector('meta[name="viewport"]')?.getAttribute('content')).toContain('width=device-width');
  });

  it('has one title of a length that shows in full', () => {
    expect(page.root.querySelectorAll('title')).toHaveLength(1);
    expect(page.title.length, `"${page.title}"`).toBeGreaterThanOrEqual(15);
    expect(page.title.length, `"${page.title}"`).toBeLessThanOrEqual(66);
  });

  it('has one description of a useful length', () => {
    expect(page.root.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(page.description.length, `"${page.description}"`).toBeGreaterThanOrEqual(70);
    expect(page.description.length, `"${page.description}"`).toBeLessThanOrEqual(165);
  });

  it('has exactly one h1, and no heading level is skipped', () => {
    expect(page.root.querySelectorAll('h1')).toHaveLength(1);
    const levels = page.root.querySelectorAll('h1, h2, h3, h4, h5, h6').map((heading) => Number(heading.tagName[1]));
    expect(levels[0], 'the first heading is the h1').toBe(1);
    levels.forEach((level, index) => {
      const previous = levels[index - 1] ?? 1;
      expect(level - previous, `heading ${index + 1} jumps from h${previous} to h${level}`).toBeLessThanOrEqual(1);
    });
  });

  it('gives every image a description and its dimensions', () => {
    for (const image of page.root.querySelectorAll('img')) {
      expect(image.getAttribute('alt'), image.outerHTML.slice(0, 120)).toBeTruthy();
      expect(image.getAttribute('width'), image.outerHTML.slice(0, 120)).toBeTruthy();
      expect(image.getAttribute('height'), image.outerHTML.slice(0, 120)).toBeTruthy();
    }
  });

  it('has a skip link and the main landmarks', () => {
    expect(page.root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#content');
    expect(page.root.querySelectorAll('main#content')).toHaveLength(1);
    expect(page.root.querySelectorAll('body > header')).toHaveLength(1);
    expect(page.root.querySelectorAll('body > footer')).toHaveLength(1);
  });
});

describe.each(indexable.map((page) => [page.path, page] as const))('%s (indexable)', (path, page) => {
  const meta = (property: string) => page.root.querySelector(`meta[property="${property}"]`)?.getAttribute('content');
  const named = (name: string) => page.root.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

  it('names itself as canonical, on the production domain, without a trailing slash or .html', () => {
    expect(page.root.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(page.canonical).toBe(canonicalOf(path));
  });

  it('carries complete Open Graph and X card data that agree with the page', () => {
    expect(meta('og:title')).toBe(page.title);
    expect(meta('og:description')).toBe(page.description);
    expect(meta('og:url')).toBe(page.canonical);
    expect(meta('og:site_name')).toBe(SITE.name);
    expect(['website', 'profile', 'article']).toContain(meta('og:type'));
    expect(named('twitter:card')).toBe('summary_large_image');
    expect(named('twitter:title')).toBe(page.title);
    expect(named('twitter:image')).toBe(meta('og:image'));
    expect(meta('og:image:alt')).toBeTruthy();
  });

  it('has its own 1200 by 630 social image', async () => {
    const url = meta('og:image')!;
    expect(url.startsWith(`${SITE.url}/og/`), url).toBe(true);
    const file = url.slice(SITE.url.length);
    expect(site.has(file), `${file} was not generated`).toBe(true);
    const { width, height, format } = await sharp(site.bytes(file)).metadata();
    expect({ width, height, format }).toEqual({ width: 1200, height: 630, format: 'png' });
    expect(site.size(file), 'social image is under 300 KB').toBeLessThan(300_000);
  });

  it('links to its Markdown version', () => {
    const twin = page.root.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute('href');
    expect(twin).toBe(path === '/' ? '/index.md' : `${path}.md`);
    expect(site.has(twin!)).toBe(true);
  });
});

describe('titles and descriptions across the site', () => {
  it('are unique', () => {
    const titles = indexable.map((page) => page.title);
    const descriptions = indexable.map((page) => page.description);
    expect(new Set(titles).size, 'duplicate title').toBe(titles.length);
    expect(new Set(descriptions).size, 'duplicate description').toBe(descriptions.length);
  });

  it('give each page a different h1', () => {
    const headings = indexable.map((page) => page.root.querySelector('h1')!.text.trim());
    expect(new Set(headings).size).toBe(headings.length);
  });
});
