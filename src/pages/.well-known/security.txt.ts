import type { APIRoute } from 'astro';
import { person } from '@/data/profile.ts';
import { absoluteUrl } from '@/data/site.ts';

/**
 * security.txt (RFC 9116). The file must carry an expiry date, so it is written
 * at build time and is always valid for about a year after the last deploy.
 */
export const GET: APIRoute = () => {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  expires.setUTCHours(0, 0, 0, 0);

  const body = [
    `Contact: mailto:${person.email}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${absoluteUrl('/.well-known/security.txt')}`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
