/**
 * No link on the site may lead nowhere. Internal links are checked against the
 * built output; external links are checked for form (reaching them is not
 * something a build should depend on).
 */
import { describe, expect, it } from 'vitest';
import { Site } from './helpers.ts';

const site = new Site();

interface Link {
  page: string;
  href: string;
  rel: string;
  target: string | undefined;
}

const links: Link[] = site.pages.flatMap((page) =>
  page.root.querySelectorAll('a[href]').map((a) => ({
    page: page.path,
    href: a.getAttribute('href')!,
    rel: a.getAttribute('rel') ?? '',
    target: a.getAttribute('target'),
  })),
);

const internal = links.filter((link) => link.href.startsWith('/') || link.href.startsWith('#'));
const external = links.filter((link) => /^https?:/.test(link.href));

describe('internal links', () => {
  it('exist', () => {
    expect(internal.length).toBeGreaterThan(100);
  });

  it('all lead to a page or file that was built', () => {
    const broken = internal
      .filter((link) => link.href.startsWith('/'))
      .filter((link) => !site.serves(link.href))
      .map((link) => `${link.page} -> ${link.href}`);
    expect(broken).toEqual([]);
  });

  it('use the canonical form: no trailing slash, no .html, no redirect in between', () => {
    const redirected = new Set(site.redirects.map((redirect) => redirect.from));
    const sloppy = internal
      .filter((link) => link.href.startsWith('/'))
      .filter((link) => {
        const path = link.href.split(/[?#]/)[0]!;
        return (path !== '/' && path.endsWith('/')) || path.endsWith('.html') || redirected.has(path);
      })
      .map((link) => `${link.page} -> ${link.href}`);
    expect(sloppy).toEqual([]);
  });

  it('point at anchors that exist on the target page', () => {
    const missing: string[] = [];
    for (const link of internal) {
      const [path, fragment] = link.href.split('#');
      if (!fragment) continue;
      const target = path ? site.pages.find((page) => page.path === path) : site.page(link.page);
      if (!target) continue;
      if (!target.root.querySelector(`[id="${fragment}"]`)) missing.push(`${link.page} -> ${link.href}`);
    }
    expect(missing).toEqual([]);
  });

  it('never use the full production address for a page of this site', () => {
    const absolute = links
      .filter((link) => link.href.startsWith('https://yesbhautik.co.in'))
      .map((link) => `${link.page} -> ${link.href}`);
    expect(absolute).toEqual([]);
  });
});

describe('external links', () => {
  it('all use https', () => {
    expect(external.filter((link) => link.href.startsWith('http:')).map((link) => link.href)).toEqual([]);
  });

  it('are well-formed and never point at a development address', () => {
    for (const link of external) {
      const url = new URL(link.href);
      expect(url.hostname, link.href).not.toMatch(/localhost|127\.0\.0\.1|\.local$|workers\.dev$|netlify\.app$/);
    }
  });

  it('carry no tracking parameters', () => {
    const tracked = external.filter((link) => /[?&](utm_[a-z]+|gclid|fbclid|srsltid|_gl)=/.test(link.href));
    expect(tracked.map((link) => link.href)).toEqual([]);
  });

  it('protect the opener whenever they open a new tab', () => {
    for (const link of links.filter((item) => item.target === '_blank')) {
      expect(link.rel, link.href).toContain('noopener');
    }
  });

  it('mark affiliate links as sponsored, and disclose them on the page', () => {
    const affiliate = external.filter((link) => /^https:\/\/(amzn\.to|(www\.)?amazon\.[a-z.]+)\//.test(link.href));
    expect(affiliate.length).toBeGreaterThan(0);
    for (const link of affiliate) {
      expect(link.rel, link.href).toContain('sponsored');
      expect(site.page(link.page).text).toContain('As an Amazon Associate I earn from qualifying purchases');
    }
  });

  it('mark links to his own profiles with rel="me"', () => {
    const home = site.page('/');
    const me = home.root.querySelectorAll('a[rel~="me"]').map((a) => a.getAttribute('href'));
    expect(me).toContain('https://github.com/yesbhautik');
    expect(me).toContain('https://www.linkedin.com/in/yesbhautik');
    expect(me).toContain('https://x.com/yesbhautik');
  });
});
