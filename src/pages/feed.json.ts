import type { APIRoute } from 'astro';
import { feedItems, jsonFeed } from '@/lib/feeds.ts';

export const GET: APIRoute = async () =>
  new Response(jsonFeed(await feedItems()), { headers: { 'Content-Type': 'application/feed+json; charset=utf-8' } });
