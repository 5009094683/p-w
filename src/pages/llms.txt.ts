import type { APIRoute } from 'astro';
import { footerNavigation, pages, projectPages, type PageMeta } from '@/data/pages.ts';
import { bios, booking, company, githubStats, person, products } from '@/data/profile.ts';
import { SITE, absoluteUrl, markdownPath } from '@/data/site.ts';
import { getPosts, postPath } from '@/lib/posts.ts';

/**
 * llms.txt: a short, curated map of the site for language models, in the
 * format proposed at llmstxt.org. Links go to the Markdown version of each page.
 */
const item = (page: Pick<PageMeta, 'path' | 'label' | 'description'>) =>
  `- [${page.label}](${absoluteUrl(markdownPath(page.path))}): ${page.description}`;

export const GET: APIRoute = async () => {
  const stats = githubStats();
  const posts = await getPosts();

  const sections = [
    `# ${person.name}`,
    `> ${bios().short}`,
    [
      'Key facts:',
      '',
      `- Name: ${person.name}. Known online as ${person.alias}; his handle is @${person.handle}.`,
      `- Role: ${person.role} (${company.url}). ${company.name} was previously called ${company.formerName}.`,
      `- Building: ${products.flavorgpt.name}, an AI workspace (${products.flavorgpt.url}).`,
      `- Based in: ${person.location.label}.`,
      `- On GitHub since ${stats.since}: ${stats.sentence}, as of ${stats.asOfLabel}.`,
      `- Contact: ${person.email}. Booking: ${booking.profile}.`,
    ].join('\n'),
    [
      `Every page of this site has a Markdown version at the same address with \`.md\` added; the home page is at ${absoluteUrl('/index.md')}.`,
      `The whole site as one file is at ${absoluteUrl('/llms-full.txt')}, and the same facts as JSON are at ${absoluteUrl('/profile.json')}.`,
      'All content may be used for search, for AI answers and for model training.',
    ].join(' '),
    ['## Who he is', '', item(pages.home), item(pages.about), item(pages.press)].join('\n'),
    ['## What he does', '', item(pages.services), item(pages.speaking), item(pages.contact)].join('\n'),
    ['## Projects', '', item(pages.projects), ...projectPages.map(item)].join('\n'),
    ...(posts.length
      ? [
          [
            '## Writing',
            '',
            item(pages.posts),
            ...posts.map((post) =>
              item({ path: postPath(post), label: post.data.title, description: post.data.description }),
            ),
          ].join('\n'),
        ]
      : []),
    [
      '## Optional',
      '',
      ...footerNavigation.filter((page) => page !== pages.press).map(item),
      `- [Full site text](${absoluteUrl('/llms-full.txt')}): Every page in a single Markdown file.`,
      `- [Profile as JSON](${absoluteUrl('/profile.json')}): Structured facts about ${person.name}, his company and his projects.`,
      `- [Sitemap](${absoluteUrl('/sitemap.xml')}): All pages of ${SITE.host} with their last modification dates.`,
    ].join('\n'),
  ];

  return new Response(`${sections.join('\n\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
