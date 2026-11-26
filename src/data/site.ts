export const SITE = {
  url: 'https://yesbhautik.co.in',
  host: 'yesbhautik.co.in',
  name: 'Bhautik Bavadiya',
  alternateName: 'Yesbhautik',
  language: 'en',
  ogLocale: 'en_IN',
  themeColor: { light: '#f6f5f1', dark: '#111214' },
  indexNowKey: 'eaa1a51214934af0838be4e9f3e563e0',
  sourceRepo: 'https://github.com/yesbhautik/yesbhautik.co.in',
} as const;

/** Canonical absolute URL for a site path. The root keeps its slash, every other path has none. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `${SITE.url}/` : `${SITE.url}${clean.replace(/\/+$/, '')}`;
}

/**
 * Site path for a built page. With `build.format: 'file'` Astro reports
 * `/about.html` and `/index.html`; the public URL has neither.
 */
export function pathFromPathname(pathname: string): string {
  const path = pathname
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/(.)\/+$/, '$1');
  return path === '' ? '/' : path;
}

/** Path of the Markdown twin for a page path. */
export function markdownPath(path: string): string {
  return path === '/' ? '/index.md' : `${path}.md`;
}
