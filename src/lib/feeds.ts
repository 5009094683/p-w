/**
 * RSS, Atom and JSON Feed, built from the articles. The three feeds stay at the
 * addresses they have always had, and they are valid with no articles at all,
 * so a subscription made today receives the first one.
 */
import { person } from '../data/profile.ts';
import { SITE, absoluteUrl } from '../data/site.ts';
import { github } from './github.ts';
import { lastModified } from './lastmod.ts';
import { getPosts, postPath } from './posts.ts';

const FEED_TITLE = `${person.name}: writing`;
const FEED_DESCRIPTION = `Articles by ${person.name} on building AI products, startups, go-to-market and Web3.`;
const LICENSE = 'CC BY-NC-SA 4.0';

export const FEEDS = {
  rss: absoluteUrl('/feed.xml'),
  atom: absoluteUrl('/feed.atom'),
  json: absoluteUrl('/feed.json'),
  home: absoluteUrl('/posts'),
} as const;

export interface FeedItem {
  title: string;
  url: string;
  description: string;
  html: string;
  published: Date;
  updated: Date;
  tags: string[];
}

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

/** Links and images inside an article are made absolute, because a feed reader has no base URL. */
const absolutize = (html: string) => html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${SITE.url}/`);

export async function feedItems(): Promise<FeedItem[]> {
  const posts = await getPosts();
  return posts.map((post) => ({
    title: post.data.title,
    url: absoluteUrl(postPath(post)),
    description: post.data.description,
    html: absolutize(post.rendered?.html ?? ''),
    published: post.data.date,
    updated: post.data.updated ?? post.data.date,
    tags: post.data.tags,
  }));
}

/** When the feed last changed: the newest article, or the site's own last change when there are none. */
function feedUpdated(items: FeedItem[]): Date {
  const newest = items.reduce<Date | undefined>(
    (latest, item) => (!latest || item.updated > latest ? item.updated : latest),
    undefined,
  );
  return newest ?? new Date(`${lastModified('/') ?? github.fetchedAt}T00:00:00Z`);
}

export function rss(items: FeedItem[]): string {
  const entries = items.map((item) =>
    [
      '    <item>',
      `      <title>${escape(item.title)}</title>`,
      `      <link>${escape(item.url)}</link>`,
      `      <guid isPermaLink="true">${escape(item.url)}</guid>`,
      `      <pubDate>${item.published.toUTCString()}</pubDate>`,
      `      <dc:creator>${escape(person.name)}</dc:creator>`,
      `      <description>${escape(item.description)}</description>`,
      ...item.tags.map((tag) => `      <category>${escape(tag)}</category>`),
      `      <content:encoded>${cdata(item.html)}</content:encoded>`,
      '    </item>',
    ].join('\n'),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escape(FEED_TITLE)}</title>`,
    `    <link>${escape(FEEDS.home)}</link>`,
    `    <description>${escape(FEED_DESCRIPTION)}</description>`,
    `    <language>${SITE.language}</language>`,
    `    <copyright>${escape(`${LICENSE}, ${person.name}`)}</copyright>`,
    `    <lastBuildDate>${feedUpdated(items).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escape(FEEDS.rss)}" rel="self" type="application/rss+xml"/>`,
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function atom(items: FeedItem[]): string {
  const entries = items.map((item) =>
    [
      '  <entry>',
      `    <title>${escape(item.title)}</title>`,
      `    <id>${escape(item.url)}</id>`,
      `    <link rel="alternate" type="text/html" href="${escape(item.url)}"/>`,
      `    <published>${item.published.toISOString()}</published>`,
      `    <updated>${item.updated.toISOString()}</updated>`,
      `    <summary>${escape(item.description)}</summary>`,
      ...item.tags.map((tag) => `    <category term="${escape(tag)}"/>`),
      `    <content type="html">${cdata(item.html)}</content>`,
      '  </entry>',
    ].join('\n'),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${SITE.language}">`,
    `  <title>${escape(FEED_TITLE)}</title>`,
    `  <subtitle>${escape(FEED_DESCRIPTION)}</subtitle>`,
    `  <id>${escape(`${SITE.url}/`)}</id>`,
    `  <link rel="alternate" type="text/html" href="${escape(FEEDS.home)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${escape(FEEDS.atom)}"/>`,
    `  <updated>${feedUpdated(items).toISOString()}</updated>`,
    `  <rights>${escape(`${LICENSE}, ${person.name}`)}</rights>`,
    '  <author>',
    `    <name>${escape(person.name)}</name>`,
    `    <uri>${escape(`${SITE.url}/`)}</uri>`,
    `    <email>${escape(person.email)}</email>`,
    '  </author>',
    ...entries,
    '</feed>',
    '',
  ].join('\n');
}

export function jsonFeed(items: FeedItem[]): string {
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    home_page_url: FEEDS.home,
    feed_url: FEEDS.json,
    language: SITE.language,
    icon: absoluteUrl('/icon-512.png'),
    favicon: absoluteUrl('/icon-192.png'),
    authors: [{ name: person.name, url: `${SITE.url}/`, avatar: absoluteUrl(person.headshot) }],
    items: items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      summary: item.description,
      content_html: item.html,
      date_published: item.published.toISOString(),
      date_modified: item.updated.toISOString(),
      tags: item.tags,
    })),
  };
  return `${JSON.stringify(feed, null, 2)}\n`;
}
