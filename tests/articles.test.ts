/**
 * The site has no articles yet, and it ships no placeholder to stand in for
 * one. To prove that publishing works anyway, this builds a second copy of the
 * site with fixture articles, a fixture talk and a fixture press mention, and
 * checks everything they touch. The copy is never deployed.
 */
import { execFile } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';
import { splitTwin } from '../src/lib/twin.ts';
import { ROOT, Site, graphNodes, typesOf } from './helpers.ts';

const OUT = join(ROOT, '.tmp', 'articles');
const ARTICLE = '/posts/how-the-article-pipeline-is-tested';
const OLDER = '/posts/an-older-article';
const DRAFT = '/posts/a-draft-that-must-not-ship';

let site: Site;

beforeAll(async () => {
  rmSync(OUT, { recursive: true, force: true });

  // The test runner marks its own environment as a test run. The build must not
  // inherit that, or it would not be the production build that gets deployed.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/^(VITEST|TEST|DEV|PROD|MODE|SSR|BASE_URL|NODE_ENV)/.test(name)),
  );

  await promisify(execFile)(join(ROOT, 'node_modules', '.bin', 'astro'), ['build', '--outDir', OUT, '--silent'], {
    cwd: ROOT,
    env: {
      ...env,
      NODE_ENV: 'production',
      POSTS_DIR: './tests/fixtures/posts',
      TALKS_DIR: './tests/fixtures/talks',
      COVERAGE_DIR: './tests/fixtures/coverage',
      LASTMOD: '',
      ASTRO_TELEMETRY_DISABLED: '1',
    },
    maxBuffer: 16 * 1024 * 1024,
  });
  site = new Site(OUT);
}, 180_000);

describe('an article', () => {
  it('gets its own indexable page with a canonical address', () => {
    const page = site.page(ARTICLE);
    expect(page.noindex).toBe(false);
    expect(page.canonical).toBe(`https://yesbhautik.co.in${ARTICLE}`);
    expect(page.root.querySelector('h1')!.text.trim()).toBe('How the article pipeline is tested');
    expect(page.root.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article');
    expect(page.root.querySelector('meta[property="article:published_time"]')?.getAttribute('content')).toBe(
      '2026-01-15T09:30:00.000Z',
    );
    expect(page.root.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')).toBe(
      '2026-02-01T09:30:00.000Z',
    );
  });

  it('is described as a BlogPosting by its author, with both dates', () => {
    const posting = graphNodes(site.page(ARTICLE)).find((node) => typesOf(node).includes('BlogPosting'))!;
    expect(posting).toMatchObject({
      headline: 'How the article pipeline is tested',
      datePublished: '2026-01-15T09:30:00.000Z',
      dateModified: '2026-02-01T09:30:00.000Z',
      author: { '@id': 'https://yesbhautik.co.in/#person' },
      keywords: 'testing, publishing',
    });
    expect(posting.image).toBe(`https://yesbhautik.co.in/og${ARTICLE}.png`);
  });

  it('has a social image, a Markdown twin and a sitemap entry', () => {
    expect(site.has(`/og${ARTICLE}.png`)).toBe(true);
    const twin = splitTwin(site.read(`${ARTICLE}.md`));
    expect(twin.body.startsWith('# How the article pipeline is tested')).toBe(true);
    expect(twin.body).toContain('| Format | Address');
    expect(twin.body).toContain('```ts\nexport function greet');
    expect(site.read('/sitemap.xml')).toContain(`<loc>https://yesbhautik.co.in${ARTICLE}</loc>`);
  });

  it('highlights code with classes, never inline styles', () => {
    const page = site.page(ARTICLE);
    expect(page.root.querySelector('pre code')).not.toBeNull();
    expect(page.root.querySelectorAll('.token').length).toBeGreaterThan(3);
    expect(page.root.querySelectorAll('[style]').length).toBe(0);
    expect(page.root.querySelectorAll('style').length).toBe(0);
  });

  it('links to its neighbors', () => {
    const hrefs = site
      .page(ARTICLE)
      .root.querySelectorAll('nav[aria-label="More writing"] a')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([OLDER]);
  });
});

describe('the writing index, once there is an article', () => {
  it('becomes indexable and lists articles newest first', () => {
    const index = site.page('/posts');
    expect(index.noindex).toBe(false);
    expect(index.root.querySelectorAll('main article h2 a').map((a) => a.getAttribute('href'))).toEqual([ARTICLE, OLDER]);
  });

  it('joins the navigation, the sitemap and llms.txt', () => {
    const nav = site
      .page('/')
      .root.querySelectorAll('header nav[aria-label="Main"] a')
      .map((a) => a.getAttribute('href'));
    expect(nav).toContain('/posts');
    expect(site.read('/sitemap.xml')).toContain('<loc>https://yesbhautik.co.in/posts</loc>');
    expect(site.read('/llms.txt')).toContain(`(https://yesbhautik.co.in${ARTICLE}.md)`);
  });
});

describe('drafts', () => {
  it('are left out of everything', () => {
    expect(site.pages.map((page) => page.path)).not.toContain(DRAFT);
    for (const file of ['/sitemap.xml', '/feed.xml', '/feed.atom', '/feed.json', '/llms.txt', '/llms-full.txt', '/posts.html']) {
      expect(site.read(file), file).not.toContain('A draft that must not ship');
    }
  });
});

describe('feeds', () => {
  it('RSS lists the articles, newest first, with full content and absolute links', () => {
    const rss = site.read('/feed.xml');
    const links = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((match) => match[1]);
    expect(links).toEqual([`https://yesbhautik.co.in${ARTICLE}`, `https://yesbhautik.co.in${OLDER}`]);
    expect(rss).toContain('<pubDate>Thu, 15 Jan 2026 09:30:00 GMT</pubDate>');
    expect(rss).toContain('href="https://yesbhautik.co.in/projects"');
    expect(rss).not.toContain('href="/projects"');
    expect(rss).toContain('<atom:link href="https://yesbhautik.co.in/feed.xml" rel="self"');
  });

  it('Atom carries the same entries with both dates', () => {
    const atom = site.read('/feed.atom');
    expect([...atom.matchAll(/<entry>/g)]).toHaveLength(2);
    expect(atom).toContain(`<id>https://yesbhautik.co.in${ARTICLE}</id>`);
    expect(atom).toContain('<published>2026-01-15T09:30:00.000Z</published>');
    expect(atom).toContain('<updated>2026-02-01T09:30:00.000Z</updated>');
  });

  it('JSON Feed is valid JSON Feed 1.1 with the same entries', () => {
    const feed = JSON.parse(site.read('/feed.json')) as {
      version: string;
      feed_url: string;
      items: { id: string; content_html: string; date_published: string; tags: string[] }[];
    };
    expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
    expect(feed.feed_url).toBe('https://yesbhautik.co.in/feed.json');
    expect(feed.items.map((item) => item.id)).toEqual([
      `https://yesbhautik.co.in${ARTICLE}`,
      `https://yesbhautik.co.in${OLDER}`,
    ]);
    expect(feed.items[0]!.content_html).toContain('<h2');
    expect(feed.items[0]!.tags).toEqual(['testing', 'publishing']);
  });
});

describe('a talk on record', () => {
  it('is listed on the speaking page and published as an Event', () => {
    const speaking = site.page('/speaking');
    expect(speaking.text).toContain('A fixture talk');
    expect(speaking.text).toContain('Fixture Conference');
    const event = graphNodes(speaking).find((node) => typesOf(node).includes('Event'))!;
    expect(event).toMatchObject({
      name: 'A fixture talk (Fixture Conference)',
      startDate: '2026-04-20',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      performer: { '@id': 'https://yesbhautik.co.in/#person' },
    });
  });
});

describe('a press mention on record', () => {
  it('is listed in the press kit', () => {
    const press = site.page('/press');
    expect(press.text).toContain('A fixture headline');
    expect(press.text).toContain('Fixture Times');
    expect(press.root.querySelector('#coverage')).not.toBeNull();
  });
});
