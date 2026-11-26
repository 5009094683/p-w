/**
 * How the site answers over HTTP, tested on a local Cloudflare runtime:
 * status codes, redirects, security headers, media types and caching.
 *
 * The old site answered every unknown address by redirecting it to itself,
 * forever. The first block here exists so that can never ship again.
 */
import { createHash } from 'node:crypto';
import { request } from 'node:http';
import { describe, expect, inject, it } from 'vitest';
import { Site } from './helpers.ts';
import { legacyUrls } from './legacy-urls.ts';

const base = inject('edgeUrl');
const site = new Site();
const get = (path: string, init?: RequestInit) => fetch(`${base}${path}`, { redirect: 'manual', ...init });

/** Where a redirect points, as a site path when it stays on this site. */
const target = (response: Response) => {
  const location = response.headers.get('location') ?? '';
  return location.startsWith(base) ? location.slice(base.length) || '/' : location;
};

/** A request with a chosen Host header, to see what a given hostname would receive. */
const headersForHost = (host: string, path = '/') =>
  new Promise<Record<string, string | string[] | undefined>>((resolve, reject) => {
    const url = new URL(base);
    const req = request({ host: url.hostname, port: url.port, path, headers: { host } }, (response) => {
      response.resume();
      resolve(response.headers);
    });
    req.once('error', reject);
    req.end();
  });

describe('addresses that do not exist', () => {
  const missing = ['/this-page-does-not-exist', '/a/b/c', '/about/extra', '/projects/no-such-project', '/posts/no-such-post', '/wp-login.php', '/.env', '/index.php'];

  it.each(missing)('%s answers 404 with the error page, and does not redirect', async (path) => {
    const response = await get(path);
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('This page does');
    expect(body).toContain('noindex');
  });

  it('do not expose the configuration files', async () => {
    for (const path of ['/_headers', '/_redirects']) {
      expect((await get(path)).status, path).toBe(404);
    }
  });
});

describe('every address the previous site published', () => {
  it.each(legacyUrls.map((entry) => [entry.path, entry.expect] as const))('%s', async (path, expectation) => {
    const response = await get(path);
    switch (expectation.kind) {
      case 'page':
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');
        break;
      case 'file':
        expect(response.status).toBe(200);
        break;
      case 'redirect':
        expect(response.status).toBe(expectation.status);
        expect(target(response)).toBe(expectation.to);
        break;
      case 'gone':
        expect(response.status, `${path} was removed because it was ${expectation.why}`).toBe(404);
        break;
    }
  });

  it('never redirect to themselves, and reach a final answer within two steps', async () => {
    for (const { path, expect: expectation } of legacyUrls) {
      if (expectation.kind !== 'redirect' || !expectation.to.startsWith('/')) continue;
      let current = path;
      const seen = [current];
      for (let hop = 0; hop < 5; hop++) {
        const response = await get(current);
        if (response.status < 300 || response.status >= 400) {
          expect(response.status, seen.join(' -> ')).toBe(200);
          break;
        }
        current = target(response);
        expect(seen, `redirect loop: ${[...seen, current].join(' -> ')}`).not.toContain(current);
        seen.push(current);
      }
      expect(seen.length, seen.join(' -> ')).toBeLessThanOrEqual(3);
    }
  });

  it('answer the same way with a trailing slash, for pages that moved', async () => {
    for (const { path, expect: expectation } of legacyUrls) {
      if (expectation.kind !== 'redirect' || path.includes('.') || !/^\/[a-z-]+$/.test(path)) continue;
      if (!site.redirects.some((redirect) => redirect.from === `${path}/`)) continue;
      const response = await get(`${path}/`);
      expect(response.status, `${path}/`).toBe(expectation.status);
      expect(target(response), `${path}/`).toBe(expectation.to);
    }
  });
});

describe('one address per page', () => {
  it.each(site.indexable.map((page) => page.path))('%s is served as HTML at its canonical address', async (path) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('sends the trailing-slash and .html forms to the canonical address', async () => {
    for (const path of site.indexable.map((page) => page.path).filter((item) => item !== '/')) {
      for (const variant of [`${path}/`, `${path}.html`]) {
        const response = await get(variant);
        expect([301, 307, 308], variant).toContain(response.status);
        expect(target(response), variant).toBe(path);
      }
    }
    const index = await get('/index.html');
    expect(target(index)).toBe('/');
  });
});

describe('security headers', () => {
  const samples = ['/', '/about', '/projects/tgmoji', '/this-page-does-not-exist'];

  it.each(samples)('%s carries the full set', async (path) => {
    const { headers } = await get(path);
    expect(headers.get('strict-transport-security')).toMatch(/max-age=\d{8,}/);
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(headers.get('permissions-policy')).toContain('camera=()');
    expect(headers.get('content-signal')).toBe('search=yes, ai-input=yes, ai-train=yes');
  });

  it.each(samples)('%s has a policy that allows its inline scripts by hash and nothing looser', async (path) => {
    const response = await get(path);
    const policy = response.headers.get('content-security-policy')!;
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("style-src 'self';");
    expect(policy).not.toContain('unsafe-inline');
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toContain('__CSP');

    const html = await response.text();
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
      (match) => !/application\/(ld\+)?json/.test(match[1]!),
    );
    expect(inline.length).toBeGreaterThan(0);
    for (const script of inline) {
      const hash = createHash('sha256').update(script[2]!).digest('base64');
      expect(policy, 'an inline script is not allowed by the policy').toContain(`'sha256-${hash}'`);
    }
  });

  it('lets SVG files style themselves but not run or load anything', async () => {
    const policy = (await get('/logo.svg')).headers.get('content-security-policy');
    expect(policy).toBe("default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  });
});

describe('search and preview deployments', () => {
  it('marks every workers.dev address noindex', async () => {
    for (const host of ['yesbhautik-site.example.workers.dev', 'abc123-yesbhautik-site.example.workers.dev']) {
      expect((await headersForHost(host))['x-robots-tag'], host).toBe('noindex');
    }
  });

  it('sends no noindex header on the production domain', async () => {
    for (const host of ['yesbhautik.co.in', 'www.yesbhautik.co.in']) {
      expect((await headersForHost(host))['x-robots-tag'], host).toBeUndefined();
      expect((await headersForHost(host, '/about'))['x-robots-tag'], host).toBeUndefined();
    }
  });
});

describe('Markdown and discovery headers', () => {
  it.each(site.indexable.map((page) => page.path))('%s advertises its Markdown version', async (path) => {
    const link = (await get(path)).headers.get('link') ?? '';
    const twin = path === '/' ? '/index.md' : `${path}.md`;
    expect(link).toContain(`<${twin}>; rel="alternate"; type="text/markdown"`);
  });

  it.each(site.indexable.map((page) => page.path))('the Markdown version of %s names the page as canonical', async (path) => {
    const twin = path === '/' ? '/index.md' : `${path}.md`;
    const response = await get(twin);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    const canonical = path === '/' ? 'https://yesbhautik.co.in/' : `https://yesbhautik.co.in${path}`;
    expect(response.headers.get('link')).toBe(`<${canonical}>; rel="canonical"`);
  });

  it('points from the home page to llms.txt, the profile and the sitemap', async () => {
    const link = (await get('/')).headers.get('link') ?? '';
    expect(link).toContain('</llms.txt>; rel="describedby"');
    expect(link).toContain('</profile.json>; rel="alternate"; type="application/json"');
    expect(link).toContain('</sitemap.xml>; rel="sitemap"');
  });

  it('can be read from any origin', async () => {
    for (const path of ['/profile.json', '/llms.txt', '/about.md', '/feed.json']) {
      expect((await get(path)).headers.get('access-control-allow-origin'), path).toBe('*');
    }
  });
});

describe('media types', () => {
  const types: [string, string][] = [
    ['/robots.txt', 'text/plain; charset=utf-8'],
    ['/llms.txt', 'text/plain; charset=utf-8'],
    ['/llms-full.txt', 'text/plain; charset=utf-8'],
    ['/sitemap.xml', 'application/xml'],
    ['/profile.json', 'application/json'],
    ['/feed.xml', 'application/rss+xml; charset=utf-8'],
    ['/feed.atom', 'application/atom+xml; charset=utf-8'],
    ['/feed.json', 'application/feed+json; charset=utf-8'],
    ['/site.webmanifest', 'application/manifest+json; charset=utf-8'],
    ['/favicon.svg', 'image/svg+xml'],
    ['/favicon.ico', 'image/vnd.microsoft.icon'],
    ['/og/home.png', 'image/png'],
    ['/.well-known/security.txt', 'text/plain; charset=utf-8'],
  ];

  it.each(types)('%s is served as %s', async (path, type) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(type);
  });
});

describe('caching', () => {
  it('lets fingerprinted assets be cached for a year', async () => {
    const assets = site.files.filter((file) => file.startsWith('/_astro/'));
    expect(assets.length).toBeGreaterThan(5);
    for (const asset of assets.slice(0, 8)) {
      expect((await get(asset)).headers.get('cache-control'), asset).toBe('public, max-age=31536000, immutable');
    }
  });

  it('makes browsers revalidate pages, so a deploy is visible at once', async () => {
    for (const path of ['/', '/about', '/index.md', '/sitemap.xml']) {
      const { headers } = await get(path);
      expect(headers.get('cache-control'), path).toBe('public, max-age=0, must-revalidate');
      expect(headers.get('etag'), path).toBeTruthy();
    }
  });
});
