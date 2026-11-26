/**
 * Every static page: its URL, its search title and description, and the words
 * on its social image. The navigation, llms.txt, the social images and the
 * tests all read this list.
 */
import { detailProjects, type Project } from './projects.ts';

export interface PageMeta {
  /** Site path, without a trailing slash (the home page is `/`). */
  path: string;
  /** Short name, for navigation, breadcrumbs and llms.txt. */
  label: string;
  /** The `<title>`. */
  title: string;
  /** The meta description. */
  description: string;
  /** Small line above the headline on the social image. */
  ogKicker: string;
  /** Headline on the social image. */
  ogTitle: string;
  /** Supporting line under that headline. */
  ogSubtitle?: string;
  /** Kept out of search results and the sitemap. */
  noindex?: boolean;
}

const page = (meta: PageMeta): PageMeta => meta;

export const pages = {
  home: page({
    path: '/',
    label: 'Home',
    title: 'Bhautik Bavadiya (Yesbhautik) | Founder & CEO of YBX Labs',
    description:
      'Bhautik Bavadiya (Yesbhautik) is the founder and CEO of YBX Labs and the builder of FlavorGPT. He helps founders with go-to-market, growth and token launches.',
    ogKicker: 'Founder & CEO, YBX Labs',
    ogTitle: 'Building AI products. Helping founders go to market.',
  }),
  about: page({
    path: '/about',
    label: 'About',
    title: 'About Bhautik Bavadiya | Founder of YBX Labs, Builder of FlavorGPT',
    description:
      'Who Bhautik Bavadiya is, what YBX Labs and FlavorGPT are, a dated timeline of his work, his training, and answers to the questions people ask most.',
    ogKicker: 'About',
    ogTitle: 'Founder of YBX Labs, builder of FlavorGPT.',
  }),
  services: page({
    path: '/services',
    label: 'Services',
    title: 'Advisory Services: Go-to-Market, TGE & AI | Bhautik Bavadiya',
    description:
      'Work with Bhautik Bavadiya on go-to-market strategy, business development, token generation events and AI product strategy. Start with a 5-minute chat.',
    ogKicker: 'Services',
    ogTitle: 'Go-to-market, growth, TGE and AI product strategy.',
  }),
  projects: page({
    path: '/projects',
    label: 'Projects',
    title: 'Projects: FlavorGPT, AI Bots & Developer Tools | Bhautik Bavadiya',
    description:
      'Products and public projects by Bhautik Bavadiya: FlavorGPT, Whatsapp-Ai-BOT, Master AI BOT, TGmoji and more, with their GitHub stars, forks and licenses.',
    ogKicker: 'Projects',
    ogTitle: 'FlavorGPT, AI chatbots and developer tools.',
  }),
  speaking: page({
    path: '/speaking',
    label: 'Speaking',
    title: 'Speaking: Invite Bhautik Bavadiya to Your Event',
    description:
      'Invite Bhautik Bavadiya to speak about AI products, startups, go-to-market and Web3. Topics, formats, practical terms and a ready-made speaker introduction.',
    ogKicker: 'Speaking',
    ogTitle: 'Talks on AI products, startups and Web3.',
  }),
  contact: page({
    path: '/contact',
    label: 'Contact',
    title: 'Contact Bhautik Bavadiya: Book a Call or Send a Message',
    description:
      'Book a 5-minute quick chat or a 60-minute consultation with Bhautik Bavadiya, or reach him by email, Telegram, WhatsApp, LinkedIn or X.',
    ogKicker: 'Contact',
    ogTitle: 'Book a call or send a message.',
  }),
  uses: page({
    path: '/uses',
    label: 'Uses',
    title: 'Uses: Hardware, Software & Services | Bhautik Bavadiya',
    description:
      'The hardware, apps, developer tools and online services Bhautik Bavadiya uses every day to build products and run YBX Labs.',
    ogKicker: 'Uses',
    ogTitle: 'The hardware, software and services I use.',
  }),
  press: page({
    path: '/press',
    label: 'Press kit',
    title: 'Press Kit: Bios, Headshot & Fact Sheet | Bhautik Bavadiya',
    description:
      'Official bios in three lengths, a headshot, logos and a sourced fact sheet for writing about or introducing Bhautik Bavadiya, founder and CEO of YBX Labs.',
    ogKicker: 'Press kit',
    ogTitle: 'Bios, headshot, logos and a fact sheet.',
  }),
  posts: page({
    path: '/posts',
    label: 'Writing',
    title: 'Writing | Bhautik Bavadiya',
    description:
      'Articles by Bhautik Bavadiya on building AI products, startups, go-to-market and Web3, with RSS, Atom and JSON feeds.',
    ogKicker: 'Writing',
    ogTitle: 'Notes on AI products, startups and Web3.',
  }),
  notFound: page({
    path: '/404',
    label: 'Not found',
    title: 'Page not found | Bhautik Bavadiya',
    description: 'This page does not exist. Start again from the home page, the projects or the contact page.',
    ogKicker: 'Error 404',
    ogTitle: 'Page not found.',
    noindex: true,
  }),
} as const satisfies Record<string, PageMeta>;

export type PageKey = keyof typeof pages;

/** Main navigation, in order. */
export const navigation: PageMeta[] = [pages.about, pages.services, pages.projects, pages.speaking, pages.contact];

/** Secondary links for the footer. */
export const footerNavigation: PageMeta[] = [pages.uses, pages.press];

const AUTHOR_SUFFIX = ' | Bhautik Bavadiya';
const HANDLE_SUFFIX = ' | Yesbhautik';

/** Appends the author's name to a title, or his handle when the name would run long. */
export function withAuthor(base: string): string {
  return (base + AUTHOR_SUFFIX).length <= 62 ? base + AUTHOR_SUFFIX : base + HANDLE_SUFFIX;
}

/** Search titles for project pages, kept short enough to show in full. */
const projectTitles: Record<string, string> = {
  flavorgpt: 'FlavorGPT: The AI Workspace by YBX Labs',
  'whatsapp-ai-bot': 'Whatsapp-Ai-BOT: ChatGPT & DALL·E on WhatsApp',
  'master-ai-bot': 'Master AI BOT: Self-Hosted Telegram GPT-4 Bot',
  'talk-with-pdf': 'Talk with PDF: Chat with Your Documents',
  tgmoji: 'TGmoji: SVG to GIF & Telegram Sticker Converter',
  xopenapi: 'XOpenAPI: JSON & RSS Endpoints for X Posts',
  'public-api-scraper': 'Public API Scraper: Find Leaked API Keys',
  'feedback-flow': 'Feedback Flow: Feedback by QR Code',
  'ttweety-connect': 'TTweetY Connect: Telegram to X Auto-Posting',
  'wa-contact': 'WA-contact: Export Your WhatsApp Contacts',
  osmo360: 'Osmo360: Android Live Preview for DJI Osmo 360',
  javagpt: 'JavaGPT: JavaFX Chat Client for OpenAI Models',
};

export function projectPageMeta(project: Project): PageMeta {
  const stack = project.detail?.stack.slice(0, 3) ?? [];
  const built = stack.length ? `, built with ${joinList(stack)}` : '';
  const full = `${project.tagline} A project by Bhautik Bavadiya${built}.`;
  const description = !project.repo
    ? `${project.tagline} The product Bhautik Bavadiya is building at YBX Labs.`
    : full.length <= 160
      ? full
      : `${project.tagline} A project by Bhautik Bavadiya.`;
  return {
    path: `/projects/${project.slug}`,
    label: project.name,
    title: withAuthor(projectTitles[project.slug] ?? project.name),
    description,
    ogKicker: 'Project',
    ogTitle: project.name,
    ogSubtitle: project.tagline,
  };
}

export const projectPages: PageMeta[] = detailProjects.map(projectPageMeta);

export function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
