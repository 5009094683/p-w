/**
 * Rules about what the site may say. No placeholder ever ships, nothing is left
 * over from the template the old site was built on, the company has one name,
 * and every published number matches the GitHub snapshot it came from.
 */
import { describe, expect, it } from 'vitest';
import { company, githubStats, person } from '../src/data/profile.ts';
import { projects } from '../src/data/projects.ts';
import { formatNumber } from '../src/lib/format.ts';
import { github, showsCounts } from '../src/lib/github.ts';
import { Site } from './helpers.ts';

const site = new Site();
const textFiles = site.files.filter((file) => /\.(html|md|txt|json|xml|atom)$/.test(file));

/** Phrases that mean "this is not finished". None may appear in anything that is served. */
const PLACEHOLDERS = [
  /lorem ipsum/i,
  /coming soon/i,
  /will be listed/i,
  /listed here soon/i,
  /to be announced/i,
  /under construction/i,
  /\bTODO\b/,
  /\bTBD\b/,
  /\bFIXME\b/,
  /example\.(com|org)/i,
  /your[- ](name|company|text) here/i,
];

/** Traces of the template and of the old, conflicting company details. */
const LEFTOVERS = [
  /theme I created/i,
  /sponsorship forwarding/i,
  /open ?collective/i,
  /\bVueUse\b/,
  /\bSlidev\b/,
  /\bUnoCSS\b/,
  /\bvitesse-(dark|light)\b/i,
  /YBX Group/,
  /ybx\.sh/,
  /yesbhautikx\.co\.in/i,
  /netlify/i,
];

describe('every served text file', () => {
  it.each(textFiles)('%s holds no placeholder text', (file) => {
    const content = site.read(file);
    for (const pattern of PLACEHOLDERS) expect(content, `${pattern}`).not.toMatch(pattern);
  });

  it.each(textFiles)('%s holds nothing from the old template', (file) => {
    const content = site.read(file);
    for (const pattern of LEFTOVERS) expect(content, `${pattern}`).not.toMatch(pattern);
  });

  it.each(textFiles)('%s has no unrendered template values', (file) => {
    const content = site.read(file);
    expect(content).not.toMatch(/\[object Object\]/);
    expect(content).not.toMatch(/\{\{[^}]*\}\}/);
    expect(content).not.toMatch(/>\s*undefined\s*</);
  });
});

describe('the company', () => {
  it('is called YBX Labs everywhere, with one address', () => {
    for (const page of site.pages) {
      const companyLinks = page.root
        .querySelectorAll('a[href]')
        .map((a) => a.getAttribute('href')!)
        .filter((href) => /ybx/i.test(href) && !/github\.com|linkedin\.com|x\.com/.test(href));
      for (const href of companyLinks) {
        expect(href.startsWith(company.url) || href.startsWith('https://tgmoji.ybxlabs.com'), `${page.path}: ${href}`).toBe(true);
      }
    }
  });
});

describe('published numbers', () => {
  const stats = githubStats();

  it('come from a snapshot with a date that is not in the future', () => {
    expect(github.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(github.fetchedAt <= new Date().toISOString().slice(0, 10)).toBe(true);
    expect(stats.stars).toBeGreaterThan(0);
  });

  it('are stated with that date wherever the totals appear', () => {
    for (const path of ['/', '/about', '/projects', '/press']) {
      const text = site.page(path).text;
      expect(text, path).toContain(formatNumber(stats.stars));
      expect(text, path).toContain(formatNumber(stats.forks));
      expect(text, path).toContain(stats.asOfLabel);
    }
  });

  it('match the snapshot on every project page that shows counts', () => {
    for (const project of projects) {
      const repo = project.repo ? github.repos[project.repo] : undefined;
      if (!project.detail || !showsCounts(repo)) continue;
      const page = site.page(`/projects/${project.slug}`);
      const cells = page.root.querySelectorAll('aside table tr').map((row) => row.text.replace(/\s+/g, ' ').trim());
      expect(cells, project.slug).toContain(`Stars ${formatNumber(repo.stars)}`);
      expect(cells, project.slug).toContain(`Forks ${formatNumber(repo.forks)}`);
      expect(page.text, project.slug).toContain(stats.asOfLabel);
    }
  });

  it('cover every project that has a repository', () => {
    for (const project of projects) {
      if (project.repo) expect(github.repos[project.repo], project.repo).toBeDefined();
    }
  });
});

describe('contact details', () => {
  it('show one email address, protected from Cloudflare email rewriting', () => {
    for (const page of site.pages) {
      const mailto = [...page.html.matchAll(/<a\b[^>]*href="mailto:([^"?]+)[^"]*"/g)];
      for (const match of mailto) {
        expect(match[1], page.path).toBe(person.email);
        const before = page.html.slice(Math.max(0, match.index - 20), match.index);
        expect(before.endsWith('<!--email_off-->'), `${page.path}: unprotected mailto link`).toBe(true);
      }
    }
  });
});
