/**
 * The layout of a Markdown twin: YAML front matter, the page as Markdown, then
 * the page's JSON-LD in a fenced block. It is the layout Cloudflare's own
 * "Markdown for Agents" conversion produces, so an agent meets one format
 * whichever way it asks for Markdown.
 */
import { createHash } from 'node:crypto';

export interface TwinInput {
  title: string;
  description: string;
  url: string;
  image?: string | undefined;
  /** The page's main content as Markdown. */
  body: string;
  /** Raw JSON-LD blocks from the page. */
  jsonLd: string[];
}

const JSON_FENCE = '\n```json\n';

const yaml = (value: string) => JSON.stringify(value);

export function composeTwin(input: TwinInput): string {
  const front = [
    '---',
    `title: ${yaml(input.title)}`,
    `description: ${yaml(input.description)}`,
    `url: ${yaml(input.url)}`,
    ...(input.image ? [`image: ${yaml(input.image)}`] : []),
    '---',
  ].join('\n');
  const data = input.jsonLd.length ? `${JSON_FENCE}${input.jsonLd.join('\n')}\n\`\`\`\n` : '';
  return `${front}\n\n${input.body}${data}`;
}

export interface TwinParts {
  /** Front matter fields, unquoted. */
  front: Record<string, string>;
  body: string;
  jsonLd: string[];
}

export function splitTwin(twin: string): TwinParts {
  const match = /^---\n([\s\S]*?)\n---\n\n/.exec(twin);
  if (!match) throw new Error('Markdown twin has no front matter');
  const front: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    const separator = line.indexOf(': ');
    front[line.slice(0, separator)] = JSON.parse(line.slice(separator + 2)) as string;
  }

  const rest = twin.slice(match[0].length);
  const fence = rest.lastIndexOf(JSON_FENCE);
  if (fence === -1) return { front, body: rest, jsonLd: [] };
  const data = rest.slice(fence + JSON_FENCE.length).replace(/\n```\n$/, '');
  return { front, body: rest.slice(0, fence), jsonLd: data.split('\n') };
}

/** The value recorded in the modification-date lock: a hash of what a reader sees. */
export function contentHash(body: string): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 16);
}
