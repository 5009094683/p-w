/**
 * Reads a built HTML page and turns its main content into Markdown.
 *
 * The Markdown twins are produced from the finished HTML rather than written
 * separately, so a twin can never say something its page does not.
 */
import type { Element, ElementContent, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

export interface InlineScript {
  type: string | undefined;
  content: string;
}

export interface ExtractedPage {
  title: string;
  description: string;
  canonical: string | undefined;
  robots: string;
  ogImage: string | undefined;
  /** Raw contents of every JSON-LD block. */
  jsonLd: string[];
  /** Inline scripts a browser would act on: JavaScript and speculation rules. */
  inlineScripts: InlineScript[];
  /** The `<main>` element. */
  main: Element | undefined;
}

const parser = unified().use(rehypeParse);

const toMarkdown = unified()
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '_',
    strong: '*',
    fences: true,
    listItemIndent: 'one',
    rule: '-',
    tightDefinitions: true,
  });

const attr = (node: Element, name: string): string | undefined => {
  const value = node.properties[name];
  if (value === undefined || value === null || value === false) return undefined;
  return Array.isArray(value) ? value.join(' ') : String(value);
};

const DATA_TYPES = new Set(['application/ld+json', 'application/json']);

export function extractPage(html: string): ExtractedPage {
  const tree = parser.parse(html) as Root;
  const page: ExtractedPage = {
    title: '',
    description: '',
    canonical: undefined,
    robots: '',
    ogImage: undefined,
    jsonLd: [],
    inlineScripts: [],
    main: undefined,
  };

  visit(tree, 'element', (node) => {
    switch (node.tagName) {
      case 'title':
        if (!page.title) page.title = toString(node).trim();
        break;
      case 'meta': {
        const name = attr(node, 'name');
        const property = attr(node, 'property');
        const content = attr(node, 'content') ?? '';
        if (name === 'description') page.description = content;
        if (name === 'robots') page.robots = content;
        if (property === 'og:image') page.ogImage = content;
        break;
      }
      case 'link':
        if (attr(node, 'rel') === 'canonical') page.canonical = attr(node, 'href');
        break;
      case 'script': {
        if (attr(node, 'src')) break;
        const type = attr(node, 'type');
        const content = toString(node);
        if (type === 'application/ld+json') page.jsonLd.push(content);
        else if (!type || !DATA_TYPES.has(type)) page.inlineScripts.push({ type, content });
        break;
      }
      case 'main':
        if (!page.main) page.main = node;
        break;
    }
  });

  return page;
}

const REMOVED_TAGS = new Set(['script', 'style', 'svg', 'template', 'source', 'noscript']);

function isElement(node: ElementContent | Root['children'][number]): node is Element {
  return node.type === 'element';
}

/** Drops decoration and anything marked `data-md-skip`, and makes every URL absolute. */
function prepare(main: Element, baseUrl: string): Element {
  const clone = structuredClone(main);

  // HTML comments (such as the markers around email addresses) are not content.
  visit(clone, 'comment', (_node, index, parent) => {
    if (!parent || index === undefined) return;
    parent.children.splice(index, 1);
    return [SKIP, index];
  });

  visit(clone, 'element', (node, index, parent) => {
    if (!parent || index === undefined) return;
    const skip = REMOVED_TAGS.has(node.tagName) || 'dataMdSkip' in node.properties || attr(node, 'ariaHidden') === 'true';
    if (skip) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }
    for (const name of ['href', 'src'] as const) {
      const value = attr(node, name);
      if (value && !value.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(value)) {
        node.properties[name] = new URL(value, baseUrl).href;
      }
    }
    return undefined;
  });

  // A <picture> is left with just its <img> once the <source> elements are gone.
  visit(clone, 'element', (node, index, parent) => {
    if (node.tagName !== 'picture' || !parent || index === undefined) return;
    const image = node.children.find((child): child is Element => isElement(child) && child.tagName === 'img');
    if (image) parent.children.splice(index, 1, image);
    else parent.children.splice(index, 1);
    return [SKIP, index];
  });

  return clone;
}

/** Markdown for the content of a page's `<main>` element. */
export async function mainToMarkdown(main: Element, baseUrl: string): Promise<string> {
  const root: Root = { type: 'root', children: prepare(main, baseUrl).children };
  const mdast = await toMarkdown.run(root);
  const markdown = toMarkdown.stringify(mdast);
  return `${markdown.replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
