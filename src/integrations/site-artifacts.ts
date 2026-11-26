/**
 * Runs after Astro has written the site and derives everything that must
 * match the finished pages exactly:
 *
 *   - a Markdown twin of every indexable page (about.html -> about.md)
 *   - llms-full.txt, the whole site as one Markdown file
 *   - sitemap.xml, with modification dates from the content lock
 *   - the script hashes in the Content-Security-Policy header
 *
 * Working from the built HTML means none of these can drift from what a
 * visitor sees.
 */
import { createHash } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { bios, person } from '../data/profile.ts';
import { SITE, absoluteUrl, markdownPath, pathFromPathname } from '../data/site.ts';
import type { LastmodEntry } from '../lib/lastmod.ts';
import { extractPage, mainToMarkdown, type ExtractedPage } from '../lib/markdown.ts';
import { composeTwin, contentHash } from '../lib/twin.ts';

/** Pages listed first in llms-full.txt and the sitemap; the rest follow alphabetically. */
const PAGE_ORDER = ['/', '/about', '/services', '/projects', '/speaking', '/contact', '/press', '/uses', '/posts'];

/** Pages whose sitemap entry also lists the portrait, to help image search. */
const PORTRAIT_PAGES = new Set(['/', '/about', '/press']);

const CSP_TOKEN = '__CSP_SCRIPT_HASHES__';
const LOCK_FILE = fileURLToPath(new URL('../data/lastmod.json', import.meta.url));

interface BuiltPage {
  path: string;
  file: string;
  page: ExtractedPage;
  noindex: boolean;
  markdown: string;
  hash: string;
}

async function findHtml(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

function order(a: BuiltPage, b: BuiltPage): number {
  const rank = (path: string) => {
    const index = PAGE_ORDER.indexOf(path);
    if (index !== -1) return index;
    // A section's children follow their parent.
    const parent = PAGE_ORDER.findIndex((item) => item !== '/' && path.startsWith(`${item}/`));
    return parent === -1 ? PAGE_ORDER.length : parent + 0.5;
  };
  return rank(a.path) - rank(b.path) || a.path.localeCompare(b.path);
}

const xml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sha256 = (value: string) => createHash('sha256').update(value).digest();

function twin(built: BuiltPage): string {
  const { page, path } = built;
  return composeTwin({
    title: page.title,
    description: page.description,
    url: absoluteUrl(path),
    image: page.ogImage,
    body: built.markdown,
    jsonLd: page.jsonLd,
  });
}

function llmsFull(pages: BuiltPage[]): string {
  const intro = [
    `# ${person.name}: full site text`,
    '',
    `> ${bios().oneLine}`,
    '',
    `Every page of ${SITE.url} in one Markdown file. Each section begins with the address of the page it came from. A short index of the site is at ${absoluteUrl('/llms.txt')}, and facts as JSON are at ${absoluteUrl('/profile.json')}.`,
  ].join('\n');
  const sections = pages.map((built) => `Source: ${absoluteUrl(built.path)}\n\n${built.markdown.trim()}`);
  return `${[intro, ...sections].join('\n\n---\n\n')}\n`;
}

function sitemap(pages: BuiltPage[], dates: Map<string, string>): string {
  const urls = pages.map((built) => {
    const image = PORTRAIT_PAGES.has(built.path)
      ? `\n    <image:image>\n      <image:loc>${xml(absoluteUrl(person.headshot))}</image:loc>\n    </image:image>`
      : '';
    return `  <url>\n    <loc>${xml(absoluteUrl(built.path))}</loc>\n    <lastmod>${dates.get(built.path)}</lastmod>${image}\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

export default function siteArtifacts(): AstroIntegration {
  return {
    name: 'site-artifacts',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const today = new Date().toISOString().slice(0, 10);
        const built: BuiltPage[] = [];
        const scriptHashes = new Set<string>();

        for (const file of await findHtml(out)) {
          const page = extractPage(await readFile(file, 'utf8'));
          for (const script of page.inlineScripts) {
            scriptHashes.add(`'sha256-${sha256(script.content).toString('base64')}'`);
          }

          const path = pathFromPathname(`/${relative(out, file).split(sep).join('/')}`);
          const noindex = /\bnoindex\b/.test(page.robots) || path === '/404';
          const markdown = page.main ? await mainToMarkdown(page.main, absoluteUrl(path)) : '';
          built.push({ path, file, page, noindex, markdown, hash: contentHash(markdown) });
        }

        const indexable = built.filter((item) => !item.noindex).sort(order);

        // Markdown twins. The home page also answers at /index.html.md, the
        // address the llms.txt proposal gives for a URL with no file name.
        for (const item of indexable) {
          const target = join(out, markdownPath(item.path));
          await writeFile(target, twin(item));
          if (item.path === '/') await copyFile(target, join(out, 'index.html.md'));
        }
        await writeFile(join(out, 'llms-full.txt'), llmsFull(indexable));

        // Modification dates: a page keeps its recorded date until its content changes.
        const lock = JSON.parse(await readFile(LOCK_FILE, 'utf8')) as Record<string, LastmodEntry>;
        const dates = new Map<string, string>();
        const next: Record<string, LastmodEntry> = {};
        const stale: string[] = [];
        for (const item of indexable) {
          const recorded = lock[item.path];
          const unchanged = recorded?.hash === item.hash;
          if (!unchanged) stale.push(item.path);
          const date = unchanged ? recorded.date : today;
          dates.set(item.path, date);
          next[item.path] = { hash: item.hash, date };
        }
        const removed = Object.keys(lock).filter((path) => !(path in next));

        if (process.env.LASTMOD === 'write') {
          if (stale.length || removed.length) {
            await writeFile(LOCK_FILE, `${JSON.stringify(next, null, 2)}\n`);
            logger.info(`lastmod: recorded ${today} for ${stale.length} changed page(s); run the build again to publish the dates.`);
          } else {
            logger.info('lastmod: every page matches the lock.');
          }
        } else if (stale.length || removed.length) {
          logger.warn(
            `lastmod: ${stale.length + removed.length} page(s) differ from src/data/lastmod.json. Run "pnpm lastmod" and commit the result.`,
          );
        }

        await writeFile(join(out, 'sitemap.xml'), sitemap(indexable, dates));

        // Allow exactly the inline scripts that were built, by hash.
        const headersFile = join(out, '_headers');
        const headers = await readFile(headersFile, 'utf8').catch(() => undefined);
        if (headers === undefined) {
          logger.warn('No _headers file in the output: the Content-Security-Policy was not written.');
        } else if (!headers.includes(CSP_TOKEN)) {
          logger.warn(`_headers has no ${CSP_TOKEN} placeholder: script hashes were not written.`);
        } else {
          await writeFile(headersFile, headers.replaceAll(CSP_TOKEN, [...scriptHashes].sort().join(' ')));
        }

        logger.info(
          `${indexable.length} pages: Markdown twins, llms-full.txt and sitemap.xml written; ${scriptHashes.size} script hash(es) in the policy.`,
        );
      },
    },
  };
}
