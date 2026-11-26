import type { APIRoute } from 'astro';
import { feedItems, rss } from '@/lib/feeds.ts';

export const GET: APIRoute = async () =>
  new Response(rss(await feedItems()), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
