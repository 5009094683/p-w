/**
 * Every address the previous site published: its sitemap, its redirects file
 * and the files other sites may link to. Each one says what it must do now.
 * Nothing is left to chance, and nothing may redirect to itself.
 */

export type Expectation =
  /** Still a page at the same address. */
  | { kind: 'page' }
  /** Still a file at the same address. */
  | { kind: 'file' }
  | { kind: 'redirect'; to: string; status: 301 | 302 }
  /** Removed on purpose: answers 404. */
  | { kind: 'gone'; why: string };

export interface LegacyUrl {
  path: string;
  expect: Expectation;
}

const page = (path: string): LegacyUrl => ({ path, expect: { kind: 'page' } });
const file = (path: string): LegacyUrl => ({ path, expect: { kind: 'file' } });
const moved = (path: string, to: string, status: 301 | 302 = 301): LegacyUrl => ({
  path,
  expect: { kind: 'redirect', to, status },
});
const gone = (path: string, why: string): LegacyUrl => ({ path, expect: { kind: 'gone', why } });

const TEMPLATE = 'left over from the template the old site was built on';
const PLACEHOLDER = 'only ever held placeholder text';

const GITHUB = 'https://github.com/yesbhautik';
const SPONSORS = 'https://github.com/sponsors/yesbhautik';
const X = 'https://x.com/yesbhautik';
const INSTAGRAM = 'https://www.instagram.com/yesbhautik';
const TELEGRAM = 'https://t.me/yesbhautik';
const WHATSAPP = 'https://wa.me/916353586391';
const MATRIX = 'https://matrix.to/#/@yesbhautik:beeper.com';
const YOUTUBE = 'https://www.youtube.com/@yesbhautik';
const MASTODON = 'https://fosstodon.org/@yesbhautik';

export const legacyUrls: LegacyUrl[] = [
  // --- The old sitemap ---
  page('/'),
  page('/projects'),
  page('/uses'),
  page('/posts'),
  moved('/chat', '/contact'),
  moved('/giving-talks', '/speaking'),
  moved('/talks', '/speaking'),
  moved('/notes', '/posts'),
  moved('/demos', '/projects'),
  moved('/sponsors-list', SPONSORS),
  gone('/bookmarks', TEMPLATE),
  gone('/hold-collective-sponsor-onetime', TEMPLATE),
  gone('/media', PLACEHOLDER),
  gone('/photos', PLACEHOLDER),
  gone('/podcasts', PLACEHOLDER),
  gone('/streams', PLACEHOLDER),
  gone('/posts/coming-soon', PLACEHOLDER),
  gone('/posts/note', PLACEHOLDER),

  // --- The old redirects: his own short links ---
  moved('/rss', '/feed.xml'),
  moved('/blog', '/posts'),
  moved('/github', GITHUB),
  moved('/gh', GITHUB),
  moved('/twitter', X),
  moved('/x', X),
  moved('/sponsor', SPONSORS),
  moved('/support', SPONSORS),
  moved('/mas', MASTODON),
  moved('/mastodon', MASTODON),
  moved('/instagram', INSTAGRAM),
  moved('/ig', INSTAGRAM),
  moved('/tg', TELEGRAM),
  moved('/telegram', TELEGRAM),
  moved('/wp', WHATSAPP),
  moved('/whatsapp', WHATSAPP),
  moved('/matrix', MATRIX),
  moved('/beeper', MATRIX),
  moved('/bluesky', 'https://bsky.app/profile/yesbhautik.co.in'),
  moved('/threads', 'https://www.threads.com/@yesbhautik'),
  moved('/yt', YOUTUBE),
  moved('/youtube', YOUTUBE),
  moved('/stars-rank', `${GITHUB}?tab=repositories&type=source&sort=stargazers`, 302),

  // --- The old redirects: short links to another developer's projects ---
  gone('/vueuse', TEMPLATE),
  gone('/vue-demi', TEMPLATE),
  gone('/chemistry', TEMPLATE),
  gone('/i18n-ally', TEMPLATE),
  gone('/unocss', TEMPLATE),
  gone('/vitest', TEMPLATE),
  gone('/slidev', TEMPLATE),
  gone('/type-challenges', TEMPLATE),
  gone('/tc', TEMPLATE),
  gone('/elk', TEMPLATE),
  gone('/.github', TEMPLATE),

  // --- Files ---
  file('/robots.txt'),
  file('/sitemap.xml'),
  file('/feed.xml'),
  file('/feed.atom'),
  file('/feed.json'),
  file('/avatar.png'),
  file('/logo.png'),
  file('/logo.svg'),
  file('/favicon.svg'),
  file('/sign.svg'),
  file('/eaa1a51214934af0838be4e9f3e563e0.txt'),
  moved('/favicon.png', '/logo.png'),
  gone('/admin/', 'a content manager that was never connected'),
  gone('/admin/config.yml', 'a content manager that was never connected'),
  gone('/QuantumNous.png', TEMPLATE),
  gone('/nitro.svg', TEMPLATE),
  gone('/badge-code-style.svg', TEMPLATE),

  // --- Social images ---
  file('/og/projects.png'),
  file('/og/uses.png'),
  file('/og/posts.png'),
  moved('/og/preview.png', '/og/home.png'),
  moved('/og/chat.png', '/og/contact.png'),
  moved('/og/giving-talks.png', '/og/speaking.png'),
  moved('/og/talks.png', '/og/speaking.png'),
];
