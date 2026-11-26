/**
 * Lighthouse CI: runs Lighthouse against the built site, served by the local
 * Cloudflare runtime, with Lighthouse's default mobile emulation (a mid-range
 * phone on a throttled connection). Run `pnpm build` first, then `pnpm lhci`.
 */
const PORT = 8798;
const origin = `http://127.0.0.1:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec wrangler dev --port ${PORT} --ip 127.0.0.1 --inspector-port 9298 --show-interactive-dev-session=false`,
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 90000,
      url: [
        `${origin}/`,
        `${origin}/about`,
        `${origin}/services`,
        `${origin}/projects`,
        `${origin}/projects/flavorgpt`,
        `${origin}/speaking`,
        `${origin}/contact`,
        `${origin}/press`,
        `${origin}/uses`,
      ],
      numberOfRuns: 2,
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
        // This Lighthouse release (12.6) reports the Content-Signal lines in
        // robots.txt as an unknown directive. Lighthouse 13 accepts them. The
        // project stays on 12.6 because 13 depends on a package that the pnpm
        // trust policy rejects, so this one audit is skipped here and
        // tests/sitemap.test.ts checks robots.txt line by line instead.
        skipAudits: ['robots-txt'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
        'total-blocking-time': ['error', { maxNumericValue: 100 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
