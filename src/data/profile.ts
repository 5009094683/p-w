/**
 * The single source of facts about Bhautik Bavadiya.
 *
 * Pages, JSON-LD, llms.txt, profile.json and the Markdown twins all read from
 * this file, so they cannot disagree. Every statement here is either something
 * Bhautik already states publicly or something a reader can check at the linked
 * source. Numbers come from the GitHub snapshot, never from this file.
 */
import { github } from '../lib/github.ts';
import { formatLongDate, formatNumber } from '../lib/format.ts';

export const person = {
  name: 'Bhautik Bavadiya',
  givenName: 'Bhautik',
  familyName: 'Bavadiya',
  /** The handle he uses on almost every platform. */
  handle: 'yesbhautik',
  alias: 'Yesbhautik',
  jobTitle: 'Founder and CEO',
  role: 'Founder and CEO of YBX Labs',
  email: 'hi@yesbhautik.co.in',
  location: {
    city: 'Ahmedabad',
    region: 'Gujarat',
    country: 'India',
    countryCode: 'IN',
    label: 'Ahmedabad, India',
  },
  motto: 'Crafting the future, today.',
  /** Path under public/. A 1000 by 1000 PNG that has lived at this URL since v1. */
  headshot: '/avatar.png',
} as const;

export interface Topic {
  name: string;
  /** A reference page that identifies the topic unambiguously. */
  sameAs?: string;
}

/** Subjects he works on and states as his focus. */
export const topics: Topic[] = [
  { name: 'AI products', sameAs: 'https://en.wikipedia.org/wiki/Generative_artificial_intelligence' },
  { name: 'Large language models', sameAs: 'https://en.wikipedia.org/wiki/Large_language_model' },
  { name: 'AI agents', sameAs: 'https://en.wikipedia.org/wiki/AI_agent' },
  { name: 'Go-to-market strategy', sameAs: 'https://en.wikipedia.org/wiki/Go-to-market_strategy' },
  { name: 'Business development', sameAs: 'https://en.wikipedia.org/wiki/Business_development' },
  { name: 'Startups', sameAs: 'https://en.wikipedia.org/wiki/Startup_company' },
  { name: 'Token generation events (TGE)' },
  { name: 'Web3', sameAs: 'https://en.wikipedia.org/wiki/Web3' },
  { name: 'Cryptocurrency', sameAs: 'https://en.wikipedia.org/wiki/Cryptocurrency' },
  { name: 'Open-source software', sameAs: 'https://en.wikipedia.org/wiki/Open-source_software' },
];

export type LinkGroup = 'profile' | 'messaging' | 'inactive';

export interface ProfileLink {
  id: string;
  label: string;
  /** What a visitor sees next to the label, such as a handle. */
  handle: string;
  url: string;
  /** Icon name as `collection:name`. */
  icon: string;
  group: LinkGroup;
  /** Listed in schema.org `sameAs`: a public profile that is verifiably his. */
  sameAs: boolean;
}

export const links: ProfileLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@yesbhautik',
    url: 'https://github.com/yesbhautik',
    icon: 'simple-icons:github',
    group: 'profile',
    sameAs: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/yesbhautik',
    url: 'https://www.linkedin.com/in/yesbhautik',
    icon: 'simple-icons:linkedin',
    group: 'profile',
    sameAs: true,
  },
  {
    id: 'x',
    label: 'X',
    handle: '@yesbhautik',
    url: 'https://x.com/yesbhautik',
    icon: 'simple-icons:x',
    group: 'profile',
    sameAs: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@yesbhautik',
    url: 'https://www.instagram.com/yesbhautik',
    icon: 'simple-icons:instagram',
    group: 'profile',
    sameAs: true,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    handle: '@yesbhautik',
    url: 'https://t.me/yesbhautik',
    icon: 'simple-icons:telegram',
    group: 'messaging',
    sameAs: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    handle: '+91 63535 86391',
    url: 'https://wa.me/916353586391',
    icon: 'simple-icons:whatsapp',
    group: 'messaging',
    sameAs: false,
  },
  {
    id: 'matrix',
    label: 'Matrix',
    handle: '@yesbhautik:beeper.com',
    url: 'https://matrix.to/#/@yesbhautik:beeper.com',
    icon: 'simple-icons:matrix',
    group: 'messaging',
    sameAs: false,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    handle: '@yesbhautik',
    url: 'https://www.youtube.com/@yesbhautik',
    icon: 'simple-icons:youtube',
    group: 'inactive',
    sameAs: true,
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    handle: '@yesbhautik.co.in',
    url: 'https://bsky.app/profile/yesbhautik.co.in',
    icon: 'simple-icons:bluesky',
    group: 'inactive',
    sameAs: true,
  },
  {
    id: 'mastodon',
    label: 'Mastodon',
    handle: '@yesbhautik@fosstodon.org',
    url: 'https://fosstodon.org/@yesbhautik',
    icon: 'simple-icons:mastodon',
    group: 'inactive',
    sameAs: true,
  },
  {
    id: 'threads',
    label: 'Threads',
    handle: '@yesbhautik',
    url: 'https://www.threads.com/@yesbhautik',
    icon: 'simple-icons:threads',
    group: 'inactive',
    sameAs: true,
  },
];

export const linkById = (id: string): ProfileLink => {
  const link = links.find((item) => item.id === id);
  if (!link) throw new Error(`Unknown profile link: ${id}`);
  return link;
};

/** Ways to get time with him. Both pages are hosted on Cal.com. */
export const booking = {
  profile: 'https://cal.com/yesbhautik',
  quickChat: {
    name: 'Quick chat',
    duration: '5 minutes',
    medium: 'WhatsApp or Telegram',
    url: 'https://cal.com/yesbhautik/quick-chat',
    summary:
      'A short, open conversation. Bring a question or two and a little research, and we will make the five minutes count.',
  },
  consultation: {
    name: 'One-to-one consultation',
    duration: '60 minutes',
    medium: 'Microsoft Teams',
    url: 'https://cal.com/yesbhautik/1-1',
    summary: 'A full hour for a complex topic or a decision that needs working through in depth.',
  },
} as const;

export const support = {
  sponsors: 'https://github.com/sponsors/yesbhautik',
  allLinks: 'https://links.yesbhautik.co.in',
} as const;

export const company = {
  name: 'YBX Labs',
  formerName: 'YesbhautikX',
  url: 'https://ybxlabs.com',
  tagline: 'Unified Tech Innovation, Always at Your Side!',
  location: 'Gujarat, India',
  /** Udyam (MSME) registration number, as published on ybxlabs.com. */
  udyam: 'UDYAM-GJ-30-0012290',
  summary:
    'YBX Labs builds technology infrastructure across artificial intelligence, machine learning and Web3. It develops its own products, led by FlavorGPT and the FlavorAI platform, and takes on specialized engineering work for other companies.',
  profiles: {
    linkedin: 'https://www.linkedin.com/company/ybxlabs',
    github: 'https://github.com/YBXLabs',
    x: 'https://x.com/ybxlabs',
  },
  contactUrl: 'https://ybxlabs.com/contact-us',
  aboutUrl: 'https://ybxlabs.com/about-us',
  careersUrl: 'https://ybxlabs.com/careers',
  /** Engineering services, as listed on ybxlabs.com/about-us. */
  services: [
    {
      name: 'AI and machine learning',
      summary: 'Building, deploying and managing AI workflows and large-scale model integrations around a company’s own data.',
      url: 'https://ybxlabs.com/services/flavorai',
    },
    {
      name: 'Web3 development',
      summary: 'Blockchain infrastructure, decentralized applications, smart contracts and financial architectures.',
      url: 'https://ybxlabs.com/services/web3.0',
    },
    {
      name: 'Architecture planning',
      summary: 'Designing and auditing backend systems for performance, concurrency and reliable deployment.',
      url: 'https://ybxlabs.com/services/architectural-planning',
    },
    {
      name: 'Open-source management',
      summary: 'Adopting, auditing, maintaining and contributing to open-source software at company scale.',
      url: 'https://ybxlabs.com/services/open-source',
    },
  ],
} as const;

export const products = {
  flavorgpt: {
    name: 'FlavorGPT',
    url: 'https://flavor-ai.tech',
    tagline: 'AI that works with your tools, not just your prompts.',
    summary:
      'FlavorGPT is an AI workspace from YBX Labs. It connects to a team’s databases, APIs and files, runs autonomous agents, lets several models answer in one conversation, supports MCP tools and a personal knowledge base, and can preview and deploy the code it writes.',
    started: '2024-02',
  },
  flavorai: {
    name: 'FlavorAI',
    url: 'https://ybxlabs.com/services/flavorai',
    summary:
      'FlavorAI is the YBX Labs platform for companies: an operating layer between a company’s applications and the language models it uses. It routes requests across models, can cross-check their output, and is also offered as one API in front of many AI providers.',
  },
} as const;

export interface Service {
  id: string;
  name: string;
  /** One sentence for lists and structured data. */
  summary: string;
  /** Longer description for the services page. */
  body: string;
  /** schema.org serviceType. */
  type: string;
}

/**
 * Advisory work he offers personally. The list of subjects is his own; the
 * descriptions explain each subject in plain terms and promise no outcome.
 */
export const services: Service[] = [
  {
    id: 'go-to-market',
    name: 'Go-to-market strategy',
    type: 'Go-to-market consulting',
    summary: 'Working out who a product is for, how to position it and how to reach its first customers.',
    body: 'For founders with a product that works and a market that has not heard of it yet. We work out who the first customers are, what you are offering them and how you will reach them.',
  },
  {
    id: 'business-development',
    name: 'Business development and growth',
    type: 'Business development consulting',
    summary: 'Finding the partners, channels and conversations that move a young company forward.',
    body: 'Partnerships, distribution and first deals. I help you decide which relationships matter most right now and how to get in front of the people behind them.',
  },
  {
    id: 'tge',
    name: 'TGE and Web3 strategy',
    type: 'Token generation event advisory',
    summary: 'Planning a token generation event and the market strategy around it.',
    body: 'A token generation event is a launch with more moving parts than most. I work with Web3 founders on the road to a TGE and on the market strategy that surrounds it.',
  },
  {
    id: 'ai-product',
    name: 'AI product strategy',
    type: 'AI product consulting',
    summary: 'Deciding where AI belongs in a product, which models to use and how to keep it reliable.',
    body: 'I build FlavorGPT, which works across more than 100 models, so these are questions I have had to answer for my own product: which models to use, what to build and what to buy, and how to keep quality up and cost down.',
  },
];

export interface Credential {
  name: string;
  issuer: string;
  /** Date issued, as YYYY-MM-DD. */
  issued: string;
  /** Public verification page. */
  url: string;
}

/** Training badges issued in his name and verifiable on Credly. */
export const credentials: Credential[] = [
  {
    name: 'AWS Academy Graduate: Machine Learning Foundations',
    issuer: 'Amazon Web Services Training and Certification',
    issued: '2024-07-17',
    url: 'https://www.credly.com/badges/367dfa42-d9b3-437c-bcc3-c9d776575879/public_url',
  },
  {
    name: 'AWS Educate: Introduction to Generative AI',
    issuer: 'Amazon Web Services Training and Certification',
    issued: '2024-07-12',
    url: 'https://www.credly.com/badges/0b2812b0-ed15-4f33-be87-efc269c02097/public_url',
  },
  {
    name: 'AWS Academy Graduate: Cloud Foundations',
    issuer: 'Amazon Web Services Training and Certification',
    issued: '2024-07-10',
    url: 'https://www.credly.com/badges/2f28818a-cff4-4834-aeb2-30c98a400ef1/public_url',
  },
];

export interface Milestone {
  /** YYYY-MM. */
  date: string;
  label: string;
  /** Where a reader can confirm it. */
  source: string;
}

/** Dated milestones. Each one is taken from a public record, not from memory. */
export const milestones: Milestone[] = [
  { date: '2020-04', label: 'Joins GitHub as @yesbhautik.', source: 'https://github.com/yesbhautik' },
  {
    date: '2023-02',
    label: 'Publishes Whatsapp-Ai-BOT, a ChatGPT and DALL·E chatbot for WhatsApp.',
    source: 'https://github.com/yesbhautik/Whatsapp-Ai-BOT',
  },
  {
    date: '2023-10',
    label: 'Publishes Master AI BOT for Telegram and Talk with PDF.',
    source: 'https://github.com/yesbhautik/Master-AI-BOT',
  },
  {
    date: '2024-02',
    label: 'Starts FlavorGPT: the repository is initialized and the core chat interface built.',
    source: 'https://flavor-ai.tech/i/about',
  },
  {
    date: '2024-08',
    label: 'FlavorGPT 2.0 launches with accounts, billing and streaming chat.',
    source: 'https://flavor-ai.tech/i/about',
  },
  {
    date: '2025-06',
    label: 'FlavorGPT 2.4 adds more than 100 models and image generation.',
    source: 'https://flavor-ai.tech/i/about',
  },
  {
    date: '2026-02',
    label: 'Releases TGmoji, an in-browser SVG to GIF and Telegram sticker converter.',
    source: 'https://github.com/yesbhautik/TGmoji',
  },
  {
    date: '2026-03',
    label: 'FlavorGPT 2.5 ships an enterprise stack, fingerprint sign-in and crypto payments.',
    source: 'https://flavor-ai.tech/i/about',
  },
];

export const speaking = {
  formats: ['Conference talks', 'Meetups', 'Workshops', 'Panels'],
  topics: [
    'Building and launching AI products',
    'Startups and the founder journey',
    'Business growth and go-to-market',
    'Crypto, Web3 and token generation events',
    'Technology leadership',
  ],
  /** His stated terms for accepting invitations. */
  terms: [
    'I give talks both in person and online.',
    'For in-person events, I ask that travel and accommodation are covered.',
    'For conferences outside India, I need some help with the business visa application.',
  ],
} as const;

/** Stats derived from the GitHub snapshot, with the date they were read. */
export function githubStats() {
  const { stars, forks, sourceRepos } = github.totals;
  return {
    stars,
    forks,
    sourceRepos,
    followers: github.user.followers,
    since: Number(github.user.createdAt.slice(0, 4)),
    sinceDate: github.user.createdAt,
    asOf: github.fetchedAt,
    asOfLabel: formatLongDate(github.fetchedAt),
    /** "604 stars and 505 forks across 40 public source repositories" */
    sentence: `${formatNumber(stars)} stars and ${formatNumber(forks)} forks across ${formatNumber(sourceRepos)} public source repositories`,
  };
}

/** Official third-person bios, for press, introductions and machine readers. */
export function bios() {
  const stats = githubStats();
  const oneLine =
    'Bhautik Bavadiya, known online as Yesbhautik, is the founder and CEO of YBX Labs and the builder of FlavorGPT.';
  const short =
    'Bhautik Bavadiya, known online as Yesbhautik, is the founder and CEO of YBX Labs, a technology company working across AI, machine learning and Web3. He is building FlavorGPT, an AI workspace that connects language models to a team’s own tools, and he works with founders on go-to-market, business development and token generation events. He is based in Ahmedabad, India.';
  const long = [
    'Bhautik Bavadiya, known online as Yesbhautik, is a technology founder based in Ahmedabad, India. He is the founder and CEO of YBX Labs, formerly YesbhautikX, which builds its own products and provides engineering services across artificial intelligence, machine learning and Web3.',
    'His main work is FlavorGPT, an AI workspace that connects language models to a team’s databases, APIs and files, with autonomous agents, multi-model chat and MCP tool integration. The same architecture underpins FlavorAI, the YBX Labs platform for companies.',
    `Alongside the company, he works directly with founders on go-to-market strategy, business development, token generation events and AI product strategy, and he is available to speak at business and technology events. He has published code on GitHub since ${stats.since}; as of ${stats.asOfLabel} his projects, among them Whatsapp-Ai-BOT and Master AI BOT, had ${stats.sentence}.`,
  ];
  return { oneLine, short, long };
}

export interface Faq {
  question: string;
  answer: string;
}

/** Plain questions with self-contained answers, written for people and for answer engines. */
export function faqs(): Faq[] {
  const stats = githubStats();
  return [
    {
      question: 'Who is Bhautik Bavadiya?',
      answer:
        'Bhautik Bavadiya is a technology founder based in Ahmedabad, India, known online as Yesbhautik. He is the founder and CEO of YBX Labs, where he is building FlavorGPT, and he works with founders on go-to-market, business development and token generation events.',
    },
    {
      question: 'Is Yesbhautik the same person as Bhautik Bavadiya?',
      answer:
        'Yes. Yesbhautik is the handle Bhautik Bavadiya uses across the web, including GitHub, X, LinkedIn, Telegram and Instagram, and it is the name of this site.',
    },
    {
      question: 'What is YBX Labs?',
      answer:
        'YBX Labs is the technology company Bhautik founded and leads. It builds its own products, led by FlavorGPT and the FlavorAI platform, and provides engineering services in AI and machine learning, Web3 development, architecture planning and open-source management. It was previously called YesbhautikX.',
    },
    {
      question: 'What is FlavorGPT?',
      answer:
        'FlavorGPT is an AI workspace from YBX Labs. It connects to a team’s databases, APIs and files, runs autonomous agents, lets several models answer in one conversation, and supports MCP tools and a personal knowledge base. It has a free tier and is available at flavor-ai.tech.',
    },
    {
      question: 'What is Bhautik known for on GitHub?',
      answer: `He publishes and maintains public projects, mostly AI chatbots and developer tools. The best known are Whatsapp-Ai-BOT, Master AI BOT and Talk with PDF. As of ${stats.asOfLabel}, his projects had ${stats.sentence}.`,
    },
    {
      question: 'What does Bhautik help founders with?',
      answer:
        'Go-to-market strategy, business development and growth, token generation events (TGE) and Web3 strategy, and AI product strategy. He is also available for talks and workshops.',
    },
    {
      question: 'How do I book time with Bhautik?',
      answer:
        'Book a 5-minute quick chat or a 60-minute one-to-one consultation at cal.com/yesbhautik, or write to hi@yesbhautik.co.in.',
    },
    {
      question: 'Where is Bhautik based?',
      answer:
        'In Ahmedabad, India. He works with founders remotely, and accepts speaking invitations both in person and online.',
    },
  ];
}
