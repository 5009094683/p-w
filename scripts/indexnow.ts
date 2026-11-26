/**
 * Tells IndexNow (Bing, Yandex, Seznam, Naver and others) which pages changed.
 * Run it after a production deploy:
 *
 *   pnpm build && pnpm indexnow            # submit
 *   pnpm indexnow -- --dry-run             # show what would be submitted
 *
 * It submits only what is really live. Before it sends anything it checks that
 * the key file is served on the production domain and that every page in the
 * sitemap answers 200 there. Run against a domain that still serves the old
 * site, it stops and submits nothing.
 */
import { readFile } from 'node:fs/promises';
import { SITE } from '../src/data/site.ts';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const dryRun = process.argv.includes('--dry-run');
const keyLocation = `${SITE.url}/${SITE.indexNowKey}.txt`;

async function main() {
  const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8').catch(() => {
    throw new Error('dist/sitemap.xml not found. Run "pnpm build" first.');
  });
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1]!)
    .filter((url) => !/\.(png|jpe?g|webp|avif|svg)$/.test(url));
  if (urlList.length === 0) throw new Error('The sitemap lists no pages.');

  const key = await fetch(keyLocation).then((response) => (response.ok ? response.text() : ''));
  if (key.trim() !== SITE.indexNowKey) {
    throw new Error(`The key file at ${keyLocation} is missing or does not match. Nothing was submitted.`);
  }

  const notLive: string[] = [];
  await Promise.all(
    urlList.map(async (url) => {
      const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      if (response.status !== 200) notLive.push(`${response.status} ${url}`);
    }),
  );
  if (notLive.length > 0) {
    throw new Error(
      `These pages are not live on ${SITE.host} yet, so nothing was submitted:\n  ${notLive.join('\n  ')}`,
    );
  }

  if (dryRun) {
    console.log(`Dry run. Would submit ${urlList.length} URLs:\n  ${urlList.join('\n  ')}`);
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: SITE.host, key: SITE.indexNowKey, keyLocation, urlList }),
  });
  if (!response.ok) {
    throw new Error(`IndexNow answered ${response.status} ${response.statusText}: ${await response.text()}`);
  }
  console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
