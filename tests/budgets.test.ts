/**
 * Speed is kept by budget. These limits fail the build when a change makes a
 * page heavier than the site promises to be.
 */
import { brotliCompressSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { Site, type BuiltPage } from './helpers.ts';

const site = new Site();
const KB = 1024;

const BUDGET = {
  /** Compressed stylesheet. */
  css: 15 * KB,
  /** Compressed HTML of one page. */
  html: 16 * KB,
  /** Everything a first visit to a page downloads before it is complete. */
  firstView: 120 * KB,
  /** Inline script on a page, uncompressed. */
  inlineScript: 1.5 * KB,
};

const brotli = (file: string) => brotliCompressSync(site.bytes(file)).length;
const stylesheets = site.files.filter((file) => file.startsWith('/_astro/') && file.endsWith('.css'));
const fonts = site.files.filter((file) => /\.(woff2?|ttf|otf)$/.test(file));

/** Files a stylesheet pulls in: fonts and masks. */
function cssAssets(css: string): string[] {
  return [...site.read(css).matchAll(/url\((['"]?)(\/[^'")]+)\1\)/g)].map((match) => match[2]!);
}

/** The largest candidate a browser could pick for an image that loads straight away. */
function eagerImageBytes(page: BuiltPage): number {
  let total = 0;
  for (const image of page.root.querySelectorAll('img')) {
    if (image.getAttribute('loading') === 'lazy') continue;
    const picture = image.closest('picture');
    const best = picture?.querySelector('source') ?? image;
    const candidates = (best.getAttribute('srcset') ?? best.getAttribute('src') ?? '')
      .split(',')
      .map((candidate) => candidate.trim().split(/\s+/)[0]!)
      .filter(Boolean);
    total += Math.max(...candidates.map((candidate) => site.size(candidate)));
  }
  return total;
}

function firstView(page: BuiltPage): number {
  const file = page.path === '/' ? '/index.html' : `${page.path}.html`;
  const styles = page.root.querySelectorAll('link[rel="stylesheet"]').map((link) => link.getAttribute('href')!);
  const assets = new Set(styles.flatMap(cssAssets));
  const assetBytes = [...assets].reduce(
    // Fonts are already compressed; SVG masks are served compressed.
    (sum, asset) => sum + (/\.woff2$/.test(asset) ? site.size(asset) : brotli(asset)),
    0,
  );
  return brotli(file) + styles.reduce((sum, style) => sum + brotli(style), 0) + assetBytes + eagerImageBytes(page);
}

describe('JavaScript', () => {
  it('ships no script files at all', () => {
    expect(site.files.filter((file) => /\.(m?js)$/.test(file))).toEqual([]);
    for (const page of site.pages) {
      expect(page.root.querySelectorAll('script[src]').length, page.path).toBe(0);
    }
  });

  it('keeps inline script to the theme switch and the speculation rules', () => {
    for (const page of site.pages) {
      const inline = page.root
        .querySelectorAll('script')
        .filter((script) => script.getAttribute('type') !== 'application/ld+json');
      expect(inline.map((script) => script.getAttribute('type') ?? 'javascript'), page.path).toEqual([
        'javascript',
        'speculationrules',
      ]);
      const bytes = inline.reduce((sum, script) => sum + script.rawText.length, 0);
      expect(bytes, page.path).toBeLessThan(BUDGET.inlineScript);
    }
  });

  it('loads nothing from another origin', () => {
    for (const page of site.pages) {
      const sources = page.root
        .querySelectorAll('[src], link[rel="stylesheet"], link[rel="preload"], link[rel="icon"], link[rel="manifest"]')
        .map((element) => element.getAttribute('src') ?? element.getAttribute('href') ?? '');
      for (const source of sources) expect(source, `${page.path}: ${source}`).toMatch(/^\/(?!\/)/);
      expect(page.html, page.path).not.toMatch(/<iframe|<embed|<object/);
    }
  });
});

describe('styles', () => {
  it('ship as one stylesheet within budget', () => {
    expect(stylesheets).toHaveLength(1);
    expect(brotli(stylesheets[0]!)).toBeLessThan(BUDGET.css);
  });

  it('are never inline, so the security policy can refuse inline styles', () => {
    for (const page of site.pages) {
      expect(page.root.querySelectorAll('style').length, `${page.path} has a <style> element`).toBe(0);
      expect(page.root.querySelectorAll('[style]').length, `${page.path} has a style attribute`).toBe(0);
    }
  });
});

describe('fonts', () => {
  it('are three self-hosted WOFF2 files', () => {
    expect(fonts.every((font) => font.endsWith('.woff2'))).toBe(true);
    expect(fonts).toHaveLength(3);
    expect(fonts.reduce((sum, font) => sum + site.size(font), 0)).toBeLessThan(80 * KB);
  });

  it('preload the two used above the fold, and only those', () => {
    for (const page of site.pages) {
      const preloads = page.root.querySelectorAll('link[rel="preload"][as="font"]');
      expect(preloads, page.path).toHaveLength(2);
      for (const preload of preloads) {
        expect(fonts).toContain(preload.getAttribute('href'));
        expect(preload.getAttribute('crossorigin'), 'font preloads must be anonymous').not.toBeUndefined();
      }
    }
  });
});

describe('page weight', () => {
  it.each(site.pages.map((page) => [page.path, page] as const))('%s: HTML within budget', (path, page) => {
    const file = path === '/' ? '/index.html' : `${path}.html`;
    expect(brotli(file), `${page.path} HTML (brotli)`).toBeLessThan(BUDGET.html);
  });

  it.each(site.pages.map((page) => [page.path, page] as const))('%s: first view within budget', (_path, page) => {
    expect(firstView(page)).toBeLessThan(BUDGET.firstView);
  });

  it('serves the portrait in modern formats at several sizes, never the original', () => {
    const home = site.page('/');
    const sources = home.root.querySelectorAll('picture source').map((source) => source.getAttribute('type'));
    expect(sources).toEqual(['image/avif', 'image/webp']);
    expect(home.html).not.toContain('src="/avatar.png"');
    const hero = home.root.querySelector('picture img')!;
    expect(hero.getAttribute('fetchpriority')).toBe('high');
    expect(hero.getAttribute('loading')).toBe('eager');
  });

  it('keeps every generated image small', () => {
    for (const file of site.files.filter((item) => item.startsWith('/_astro/') && /\.(avif|webp|jpe?g|png)$/.test(item))) {
      expect(site.size(file), file).toBeLessThan(100 * KB);
    }
  });
});
