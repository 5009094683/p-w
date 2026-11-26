/**
 * The machine-readable layer: Markdown twins, llms.txt, llms-full.txt and
 * profile.json. Each must exist, be clean, and agree with the pages.
 */
import { describe, expect, it } from 'vitest';
import { githubStats, links, person } from '../src/data/profile.ts';
import { detailProjects } from '../src/data/projects.ts';
import { splitTwin } from '../src/lib/twin.ts';
import { Site, normalize } from './helpers.ts';

const site = new Site();
const twinPath = (path: string) => (path === '/' ? '/index.md' : `${path}.md`);

describe.each(site.indexable.map((page) => [page.path, page] as const))('Markdown twin of %s', (path, page) => {
  const twin = site.read(twinPath(path));
  const { front, body, jsonLd } = splitTwin(twin);

  it('opens with front matter that matches the page', () => {
    expect(front.title).toBe(page.title);
    expect(front.description).toBe(page.description);
    expect(front.url).toBe(page.canonical);
    expect(front.image).toBe(page.root.querySelector('meta[property="og:image"]')?.getAttribute('content'));
  });

  it('starts with the page heading', () => {
    const heading = normalize(page.root.querySelector('h1')!.text);
    expect(body.startsWith(`# ${heading}`), body.slice(0, 80)).toBe(true);
  });

  it('is clean Markdown: no leftover tags, comments or template values', () => {
    expect(body).not.toMatch(/<\/?(div|span|section|article|svg|path|picture|source|script|style|button|nav)\b/i);
    expect(body).not.toContain('<!--');
    expect(body).not.toMatch(/\bundefined\b|\[object Object\]|\bNaN\b/);
    expect(body).not.toMatch(/\n{3,}/);
  });

  it('carries the substance of the page', () => {
    // Every paragraph of the page should survive the conversion.
    const paragraphs = page.root
      .querySelectorAll('main p')
      .filter((p) => !p.closest('[data-md-skip]') && p.getAttribute('data-md-skip') === undefined)
      .map((p) => normalize(p.text))
      .filter((text) => text.length > 60 && !/[_*[\]<>#`|\\]/.test(text));
    expect(paragraphs.length).toBeGreaterThan(0);
    const flat = normalize(body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`\\]/g, ''));
    for (const paragraph of paragraphs) {
      expect(flat, `missing from the twin: "${paragraph.slice(0, 70)}"`).toContain(paragraph.replace(/[*_`\\]/g, ''));
    }
  });

  it('uses absolute links only', () => {
    const targets = [...body.matchAll(/\]\(([^)\s]+)/g)].map((match) => match[1]!);
    for (const target of targets) expect(target, target).toMatch(/^(https:\/\/|mailto:|#)/);
  });

  it('ends with the same structured data as the page', () => {
    expect(jsonLd.map((block) => JSON.parse(block) as unknown)).toEqual(page.jsonLd);
  });
});

describe('Markdown twins as a set', () => {
  it('exist for indexable pages only', () => {
    const twins = site.files.filter((file) => file.endsWith('.md')).sort();
    const expected = [...site.indexable.map((page) => twinPath(page.path)), '/index.html.md'].sort();
    expect(twins).toEqual(expected);
  });

  it('serve the home page at /index.html.md as well, as the llms.txt proposal describes', () => {
    expect(site.read('/index.html.md')).toBe(site.read('/index.md'));
  });
});

describe('llms.txt', () => {
  const llms = site.read('/llms.txt');

  it('follows the llms.txt layout: a title, a summary in a blockquote, then sections of links', () => {
    const lines = llms.split('\n');
    expect(lines[0]).toBe(`# ${person.name}`);
    expect(lines[2]?.startsWith('> ')).toBe(true);
    expect(llms).toMatch(/\n## [^\n]+\n\n- \[/);
    expect(llms).toContain('\n## Optional\n');
  });

  it('links only to files that exist', () => {
    const urls = [...llms.matchAll(/\]\((https:\/\/yesbhautik\.co\.in[^)]*)\)/g)].map((match) => match[1]!);
    expect(urls.length).toBeGreaterThan(15);
    for (const url of urls) {
      expect(site.has(new URL(url).pathname), url).toBe(true);
    }
  });

  it('links to the Markdown version of every main page and every project page', () => {
    for (const path of ['/index', '/about', '/services', '/projects', '/speaking', '/contact', '/press', '/uses']) {
      expect(llms, path).toContain(`(https://yesbhautik.co.in${path}.md)`);
    }
    for (const project of detailProjects) {
      expect(llms, project.slug).toContain(`(https://yesbhautik.co.in/projects/${project.slug}.md)`);
    }
  });

  it('states the key facts with the same numbers as the pages', () => {
    const stats = githubStats();
    expect(llms).toContain(stats.sentence);
    expect(llms).toContain(stats.asOfLabel);
    expect(llms).toContain(person.email);
  });
});

describe('llms-full.txt', () => {
  const full = site.read('/llms-full.txt');

  it('contains every indexable page, each introduced by its address', () => {
    for (const page of site.indexable) {
      expect(full, page.path).toContain(`Source: ${page.canonical}\n`);
      expect(full, page.path).toContain(`# ${normalize(page.root.querySelector('h1')!.text)}`);
    }
  });

  it('holds text only: no structured data blocks and no markup', () => {
    expect(full).not.toContain('```json');
    expect(full).not.toMatch(/<\/?(div|span|svg)\b/);
  });
});

describe('profile.json', () => {
  const profile = JSON.parse(site.read('/profile.json')) as {
    '@id': string;
    name: string;
    handle: string;
    email: string;
    company: { name: string };
    github: Record<string, unknown>;
    links: { url: string }[];
    projects: { url: string }[];
  };

  it('identifies the person the same way the pages do', () => {
    expect(profile.name).toBe(person.name);
    expect(profile['@id']).toBe('https://yesbhautik.co.in/#person');
    expect(profile.handle).toBe(person.handle);
    expect(profile.email).toBe(person.email);
    expect(profile.company.name).toBe('YBX Labs');
  });

  it('reports the same GitHub numbers as the pages, with their date', () => {
    const stats = githubStats();
    expect(profile.github).toMatchObject({
      stars: stats.stars,
      forks: stats.forks,
      publicSourceRepositories: stats.sourceRepos,
      asOf: stats.asOf,
    });
    const home = site.page('/').text;
    expect(home).toContain(String(stats.stars));
    expect(home).toContain(String(stats.forks));
  });

  it('lists every profile link and every project', () => {
    expect(profile.links.map((link) => link.url)).toEqual(links.map((link) => link.url));
    expect(profile.projects.length).toBeGreaterThanOrEqual(detailProjects.length);
    for (const project of profile.projects) expect(project.url).toMatch(/^https:\/\//);
  });
});
