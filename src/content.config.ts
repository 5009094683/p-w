/**
 * Content that is added over time, one file per entry.
 *
 *   src/content/posts/      articles, as Markdown
 *   src/content/talks/      talks that have been given or are confirmed
 *   src/content/coverage/   press coverage, interviews and podcasts
 *
 * Nothing is published from an empty folder: the pages that list this content
 * show a section only when it has entries. Files starting with `_` are ignored.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Tests point these at fixture folders so the article pipeline can be built
// and checked without publishing a placeholder.
const postsDir = process.env.POSTS_DIR ?? './src/content/posts';
const talksDir = process.env.TALKS_DIR ?? './src/content/talks';
const coverageDir = process.env.COVERAGE_DIR ?? './src/content/coverage';

const posts = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: postsDir }),
  schema: z.object({
    title: z.string().min(10).max(90),
    /** Shown in search results and feeds. */
    description: z.string().min(50).max(165),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Drafts are built in development and left out of production. */
    draft: z.boolean().default(false),
  }),
});

const talks = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,yaml,yml,json}', base: talksDir }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    eventUrl: z.url().optional(),
    date: z.coerce.date(),
    /** City and country, or "Online". */
    location: z.string(),
    online: z.boolean().default(false),
    slides: z.url().optional(),
    recording: z.url().optional(),
    summary: z.string().optional(),
  }),
});

const coverage = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,yaml,yml,json}', base: coverageDir }),
  schema: z.object({
    title: z.string(),
    outlet: z.string(),
    url: z.url(),
    date: z.coerce.date(),
    kind: z.enum(['article', 'interview', 'podcast', 'video', 'mention']).default('article'),
  }),
});

export const collections = { posts, talks, coverage };
