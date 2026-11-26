/**
 * The edge configuration files have hard limits and a few rules of their own.
 * Breaking one fails silently in production (a rule is ignored), so they are
 * checked here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { links, support } from '../src/data/profile.ts';
import { ROOT, Site } from './helpers.ts';
import { legacyUrls } from './legacy-urls.ts';

const site = new Site();
const headers = site.read('/_headers');
const redirects = site.redirects;

describe('_headers', () => {
  const lines = headers.split('\n');
  const rules = lines.filter((line) => line && !line.startsWith('#') && !/^\s/.test(line));

  it('stays within Cloudflare limits: 100 rules, 2,000 characters a line', () => {
    expect(rules.length).toBeLessThanOrEqual(100);
    for (const line of lines) expect(line.length, line.slice(0, 60)).toBeLessThanOrEqual(2000);
  });

  it('has had its placeholder replaced with real script hashes', () => {
    expect(headers).not.toContain('__CSP_SCRIPT_HASHES__');
    expect(headers).toMatch(/script-src 'self'( 'sha256-[A-Za-z0-9+/]{43}=')+;/);
  });

  it('uses a path or an https URL for every rule, with at most one wildcard', () => {
    for (const rule of rules) {
      expect(rule, rule).toMatch(/^(\/|https:\/\/)/);
      expect(rule.split('*').length - 1, rule).toBeLessThanOrEqual(1);
    }
  });

  it('removes a header only after the rule that set it', () => {
    let seenGlobalRule = false;
    for (const line of lines) {
      if (line === '/*') seenGlobalRule = true;
      if (/^\s+! /.test(line)) expect(seenGlobalRule, `"${line.trim()}" comes before the rule it undoes`).toBe(true);
    }
  });
});

describe('_redirects', () => {
  it('stays within Cloudflare limits: 2,000 static rules, 1,000 characters each', () => {
    expect(redirects.length).toBeLessThanOrEqual(2000);
    for (const line of site.read('/_redirects').split('\n')) expect(line.length).toBeLessThanOrEqual(1000);
  });

  it('uses only redirect status codes, and never the same source twice', () => {
    for (const redirect of redirects) expect([301, 302, 303, 307, 308], redirect.from).toContain(redirect.status);
    const sources = redirects.map((redirect) => redirect.from);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('never shadows a page that exists', () => {
    for (const redirect of redirects) {
      expect(site.serves(redirect.from), `${redirect.from} is both a page and a redirect`).toBe(false);
    }
  });

  it('sends every internal redirect to something that exists, in one step', () => {
    const sources = new Set(redirects.map((redirect) => redirect.from));
    for (const redirect of redirects.filter((item) => item.to.startsWith('/'))) {
      expect(site.serves(redirect.to), `${redirect.from} -> ${redirect.to}`).toBe(true);
      expect(sources.has(redirect.to), `${redirect.from} -> ${redirect.to} is a chain`).toBe(false);
    }
  });

  it('points every short link at the same address the site itself links to', () => {
    const known = new Set([...links.map((link) => link.url), support.sponsors, 'https://cal.com/yesbhautik']);
    const external = redirects.filter((redirect) => redirect.to.startsWith('https://') && redirect.from !== '/stars-rank');
    expect(external.length).toBeGreaterThan(15);
    for (const redirect of external) expect(known, `${redirect.from} -> ${redirect.to}`).toContain(redirect.to);
  });

  it('agrees with the list of legacy addresses, rule for rule', () => {
    for (const { path, expect: expectation } of legacyUrls) {
      const rule = redirects.find((redirect) => redirect.from === path);
      if (expectation.kind === 'redirect') {
        expect(rule, `${path} should redirect`).toEqual({ from: path, to: expectation.to, status: expectation.status });
      } else {
        expect(rule, `${path} should not redirect`).toBeUndefined();
      }
      if (expectation.kind === 'page' || expectation.kind === 'file') {
        expect(site.serves(path), `${path} should still exist`).toBe(true);
      }
      if (expectation.kind === 'gone') {
        expect(site.serves(path), `${path} should be gone`).toBe(false);
      }
    }
  });
});

describe('wrangler.jsonc', () => {
  // The file has comments, so strip them before parsing.
  const raw = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8');
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, '')) as {
    main?: string;
    assets: { directory: string; html_handling: string; not_found_handling: string; run_worker_first?: unknown };
  };

  it('serves static assets only, with no Worker script in front of them', () => {
    expect(config.main).toBeUndefined();
    expect(config.assets.run_worker_first).toBeUndefined();
    expect(config.assets.directory).toBe('./dist');
  });

  it('gives every page one address and unknown addresses a real 404', () => {
    expect(config.assets.html_handling).toBe('drop-trailing-slash');
    expect(config.assets.not_found_handling).toBe('404-page');
    expect(site.has('/404.html')).toBe(true);
  });
});
