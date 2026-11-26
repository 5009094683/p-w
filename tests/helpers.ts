/**
 * Reads the built site so the tests can check what will actually be served.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { SITE, pathFromPathname } from '../src/data/site.ts';

export const ROOT = process.cwd();
export const DIST = join(ROOT, 'dist');

export interface BuiltPage {
  /** Site path: `/`, `/about`, `/projects/tgmoji`. */
  path: string;
  html: string;
  root: HTMLElement;
  title: string;
  description: string;
  robots: string;
  canonical: string | undefined;
  noindex: boolean;
  /** Text of the `<main>` element with whitespace collapsed. */
  text: string;
  /** Parsed JSON-LD blocks. */
  jsonLd: unknown[];
}

export interface Redirect {
  from: string;
  to: string;
  status: number;
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

export class Site {
  readonly dir: string;
  #pages: BuiltPage[] | undefined;
  #files: string[] | undefined;

  constructor(dir = DIST) {
    this.dir = dir;
    if (!existsSync(join(dir, 'index.html'))) {
      throw new Error(`No built site in ${relative(ROOT, dir) || dir}. Run "pnpm build" before the tests.`);
    }
  }

  /** Every file in the output, as a site path such as `/about.html`. */
  get files(): string[] {
    this.#files ??= readdirSync(this.dir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile())
      .map((entry) => `/${relative(this.dir, join(entry.parentPath, entry.name)).split(sep).join('/')}`)
      .sort();
    return this.#files;
  }

  get pages(): BuiltPage[] {
    this.#pages ??= this.files
      .filter((file) => file.endsWith('.html'))
      .map((file) => {
        const html = this.read(file);
        // By default the parser keeps the inside of <pre> as raw text; code blocks need to be read.
        const root = parse(html, { comment: true, blockTextElements: { script: true, noscript: true, style: true } });
        const meta = (name: string) => root.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '';
        const path = pathFromPathname(file);
        const robots = meta('robots');
        return {
          path,
          html,
          root,
          title: normalize(root.querySelector('title')?.text ?? ''),
          description: meta('description'),
          robots,
          canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          noindex: /\bnoindex\b/.test(robots),
          text: normalize(root.querySelector('main')?.text ?? ''),
          jsonLd: root
            .querySelectorAll('script[type="application/ld+json"]')
            .map((script) => JSON.parse(script.rawText) as unknown),
        };
      });
    return this.#pages;
  }

  get indexable(): BuiltPage[] {
    return this.pages.filter((page) => !page.noindex);
  }

  page(path: string): BuiltPage {
    const found = this.pages.find((page) => page.path === path);
    if (!found) throw new Error(`No built page at ${path}`);
    return found;
  }

  has(file: string): boolean {
    return existsSync(join(this.dir, file));
  }

  read(file: string): string {
    return readFileSync(join(this.dir, file), 'utf8');
  }

  bytes(file: string): Buffer {
    return readFileSync(join(this.dir, file));
  }

  size(file: string): number {
    return statSync(join(this.dir, file)).size;
  }

  /**
   * Whether a site path is served: a page (`/about` from about.html) or a file.
   * Mirrors Cloudflare's `drop-trailing-slash` handling of HTML.
   */
  serves(path: string): boolean {
    const clean = path.split(/[?#]/)[0]!;
    if (clean === '/') return this.has('/index.html');
    if (clean.endsWith('/')) return false;
    return this.has(clean) || this.has(`${clean}.html`);
  }

  get redirects(): Redirect[] {
    return this.read('/_redirects')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [from = '', to = '', status = '302'] = line.split(/\s+/);
        return { from, to, status: Number(status) };
      });
  }
}

/** Absolute URL of a page path on the production site. */
export const canonicalOf = (path: string) => (path === '/' ? `${SITE.url}/` : `${SITE.url}${path}`);

/** All nodes of a page's JSON-LD graph. */
export function graphNodes(page: BuiltPage): Record<string, unknown>[] {
  return page.jsonLd.flatMap((block) => {
    const graph = (block as { '@graph'?: unknown })['@graph'];
    return Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [block as Record<string, unknown>];
  });
}

export function typesOf(node: Record<string, unknown>): string[] {
  const type = node['@type'];
  return Array.isArray(type) ? (type as string[]) : typeof type === 'string' ? [type] : [];
}

/** Walks every value in a JSON structure. */
export function walk(value: unknown, visit: (value: unknown, key: string | undefined) => void, key?: string): void {
  visit(value, key);
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit, key));
  else if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey);
  }
}

export { normalize };
