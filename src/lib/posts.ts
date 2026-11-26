import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Talk = CollectionEntry<'talks'>;
export type Coverage = CollectionEntry<'coverage'>;

const newestFirst = <T extends { data: { date: Date } }>(a: T, b: T) => b.data.date.valueOf() - a.data.date.valueOf();

/**
 * Collections are read once per build. Every page asks whether there are
 * articles (the navigation depends on it), and an empty collection would
 * otherwise log a warning for each page.
 */
const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (import.meta.env.DEV) return load();
  let result = cache.get(key) as Promise<T> | undefined;
  if (!result) {
    result = load();
    cache.set(key, result);
  }
  return result;
}

/** Published articles, newest first. Drafts appear only in development. */
export function getPosts(): Promise<Post[]> {
  return once('posts', async () => {
    const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
    return posts.sort(newestFirst);
  });
}

export async function hasPosts(): Promise<boolean> {
  return (await getPosts()).length > 0;
}

export function postPath(post: Post): string {
  return `/posts/${post.id}`;
}

export function getTalks(): Promise<Talk[]> {
  return once('talks', async () => (await getCollection('talks')).sort(newestFirst));
}

export function getCoverage(): Promise<Coverage[]> {
  return once('coverage', async () => (await getCollection('coverage')).sort(newestFirst));
}
