import type { APIRoute, GetStaticPaths } from 'astro';
import { pages, projectPages, type PageMeta } from '@/data/pages.ts';
import { renderOgImage, type OgCard } from '@/lib/og.ts';
import { getPosts, postPath } from '@/lib/posts.ts';
import { ogSlug } from '@/lib/seo.ts';

/** One social image per page: /og/home.png, /og/about.png, /og/projects/tgmoji.png and so on. */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  const cards: OgCard[] = [
    ...[...Object.values<PageMeta>(pages), ...projectPages].map((page) => ({
      kicker: page.ogKicker,
      title: page.ogTitle,
      ...(page.ogSubtitle ? { subtitle: page.ogSubtitle } : {}),
      path: page.path,
    })),
    ...posts.map((post) => ({ kicker: 'Writing', title: post.data.title, path: postPath(post) })),
  ];
  return cards.map((card) => ({ params: { slug: ogSlug(card.path) }, props: card }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const image = await renderOgImage(props as OgCard);
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
