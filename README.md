# yesbhautik.co.in

The personal site of [Bhautik Bavadiya](https://yesbhautik.co.in), version 2.

A static [Astro](https://astro.build) site served from Cloudflare's edge. Pages ship as plain HTML with one small inline script, a single stylesheet and three self-hosted fonts. Every fact on the site comes from one place, so the pages, the structured data and the files written for AI systems cannot disagree.

## Commands

Requires Node 22 (see `.nvmrc`) and pnpm.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local development server. |
| `pnpm build` | Builds the site into `dist/`. |
| `pnpm preview` | Builds, then serves `dist/` on the local Cloudflare runtime, with the real redirects and headers. |
| `pnpm verify` | Lint, type-check, build and every test. This is the gate: run it before pushing. |
| `pnpm lhci` | Lighthouse on a throttled mobile profile (needs a build and Chrome). |
| `pnpm lastmod` | Records today's date for pages whose content changed. Commit the result. |
| `pnpm sync:github` | Refreshes star and fork counts from GitHub. Follow it with `pnpm lastmod`. |
| `pnpm icons` | Redraws the site icons from the monogram. |
| `pnpm run deploy` | Builds and deploys with Wrangler. Needs `CLOUDFLARE_API_TOKEN`. |
| `pnpm indexnow` | After a production deploy, tells IndexNow which pages exist. |
| `EDGE_URL=https://… pnpm test:live` | Runs the HTTP tests against a deployed site. |

## Where things live

| To change | Edit |
| --- | --- |
| Who he is: role, bios, links, services, training, timeline, FAQ | `src/data/profile.ts` |
| Projects and their descriptions | `src/data/projects.ts` |
| The uses list | `src/data/uses.ts` |
| Page titles, descriptions and social image text | `src/data/pages.ts` |
| Redirects and short links | `public/_redirects` (and `tests/legacy-urls.ts`) |
| Response headers | `public/_headers` |
| Colors, type and components | `src/styles/global.css`, `src/components/` |

### Adding content

Each of these is one file. Nothing is published from an empty folder, and files starting with `_` are ignored.

**An article**: `src/content/posts/my-title.md`. The file name becomes the address (`/posts/my-title`). With the first article, "Writing" joins the navigation and the page becomes indexable.

```md
---
title: The title of the article
description: One or two sentences, 50 to 165 characters, shown in search results and feeds.
date: 2026-12-01
tags: [ai, startups]
---

The article, in Markdown.
```

**A talk**: `src/content/talks/event-name.yaml`. Once a talk is on record it is listed on the speaking page and published as a schema.org `Event`.

```yaml
title: The title of the talk
event: Name of the event
eventUrl: https://…
date: 2026-12-01
location: Ahmedabad, India
online: false
slides: https://…
recording: https://…
```

**Press coverage**: `src/content/coverage/outlet-headline.yaml`, listed in the press kit.

```yaml
title: The headline
outlet: Name of the publication
url: https://…
date: 2026-12-01
kind: article # article, interview, podcast, video or mention
```

## How it stays consistent

```
src/data/*.ts + src/data/github.json   the facts, and dated numbers from GitHub
        │
        ▼
     Astro build ──► HTML pages, JSON-LD, social images, feeds, llms.txt, profile.json
        │
        ▼
src/integrations/site-artifacts.ts     reads the finished HTML and derives:
                                         a Markdown twin of every page (/about.md)
                                         llms-full.txt and sitemap.xml
                                         the script hashes in the security policy
```

- **Numbers** are never typed in. Stars and forks come from `src/data/github.json`, which records the date they were read, and every page that shows them shows that date.
- **Structured data** describes only what its page shows. `tests/structured-data.test.ts` enforces it.
- **Modification dates** in the sitemap and the structured data come from `src/data/lastmod.json`, which holds a hash of each page's visible content. A date moves only when the content does. After a content change, run `pnpm lastmod` and commit the file; a test fails if it is stale.
- **Markdown twins** are converted from the built pages, so they cannot fall behind them.

## Checks

`pnpm verify` runs everything below against the built site, and CI runs the same on every pull request.

- One title, description, h1 and canonical address per page, all unique; a 1200 by 630 social image for each.
- Valid, connected JSON-LD that mirrors the page.
- No broken internal link or anchor.
- The sitemap lists exactly the indexable pages.
- A clean Markdown twin for every page; `llms.txt` links only to files that exist.
- No placeholder text anywhere, and nothing left over from the old template.
- Budgets: no script files, one stylesheet under 15 KB compressed, a first view under 120 KB including fonts.
- Every address the old site published does what `tests/legacy-urls.ts` says it should, on a local Cloudflare runtime.
- Security headers, media types and caching.
- The article pipeline, built from fixtures in `tests/fixtures/`, so it is proven before the first real article.

`pnpm lhci` then requires Lighthouse scores of 100 for accessibility, best practices and SEO, and at least 95 for performance.

Two tools are held one release back because their newest versions depend on packages that this repository's pnpm trust policy (`trustPolicy: no-downgrade`) rejects: `@types/node` is on 24, and Lighthouse CI is on 0.15 (Lighthouse 12.6). That Lighthouse release does not recognize the `Content-Signal` line in `robots.txt`, so its `robots-txt` audit is skipped and a test checks the file instead. Lighthouse 13 accepts the line.

## Deploying

The site is a Cloudflare Worker that serves static assets only (`wrangler.jsonc`). There is no Worker script, so no request touches metered compute.

**Preview.** Any deploy to a `workers.dev` address is marked `noindex` by `public/_headers`, so a preview can never compete with the real site in search.

**Production.** Connect the repository in Cloudflare (Workers and Pages, then Workers Builds) with build command `pnpm build` and deploy command `npx wrangler deploy`. Each merge to `main` then deploys, and each pull request gets its own preview. Alternatively, run `pnpm run deploy` with a `CLOUDFLARE_API_TOKEN`.

### Go-live checklist

The domain's zone and the Worker must be in the same Cloudflare account.

1. **Attach the domain.** Note the current DNS records for `yesbhautik.co.in` and `www` (they are the rollback). Uncomment the `routes` block in `wrangler.jsonc` and deploy. Cloudflare asks for the existing apex record to be removed first.
2. **Redirect `www`.** Add a Redirect Rule: when the hostname is `www.yesbhautik.co.in`, redirect with status 301 to `concat("https://yesbhautik.co.in", http.request.uri.path)`, keeping the query string.
3. **Stop Cloudflare rewriting the HTML.** The zone currently has Rocket Loader and Email Address Obfuscation switched on. Both inject scripts into pages. Switch them off for this hostname (Speed and Scrape Shield settings, or one Configuration Rule).
4. **Turn HSTS back on.** The zone currently sends `max-age=0`. Under SSL/TLS, Edge Certificates, enable HSTS with a 12-month max-age. Leave "include subdomains" and "preload" off unless every subdomain serves HTTPS.
5. **Let AI crawlers in.** Under Security, Bots, make sure "Block AI bots" is off and that the managed `robots.txt` is not adding `Disallow` rules. This site's own `robots.txt` invites them.
6. **Serve Markdown on request.** Either enable Markdown for Agents (Pro plan and above), or add two URL Rewrite rules, in this order:
   - when `http.request.uri.path eq "/"` and `any(http.request.headers["accept"][*] contains "text/markdown")`, rewrite the path to `/index.md`;
   - when `any(http.request.headers["accept"][*] contains "text/markdown")` and `not http.request.uri.path contains "."`, rewrite the path to `concat(http.request.uri.path, ".md")`.
7. **Verify.** `EDGE_URL=https://yesbhautik.co.in pnpm test:live` runs the redirect, header and 404 tests against the live domain.
8. **Announce.** `pnpm build && pnpm indexnow`, then submit `https://yesbhautik.co.in/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

To roll back, restore the DNS records noted in step 1.

## License

Code is licensed under [MIT](./LICENSE). Words and images are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
