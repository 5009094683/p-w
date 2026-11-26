import type { APIRoute } from 'astro';
import { atom, feedItems } from '@/lib/feeds.ts';

export const GET: APIRoute = async () =>
  new Response(atom(await feedItems()), { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
