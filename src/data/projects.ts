/**
 * Curated project list. Descriptions are written from each project's own
 * README or product site. Stars, forks, language and license are not stored
 * here: they are joined from the GitHub snapshot (src/data/github.json), which
 * `pnpm sync:github` refreshes.
 */

export type ProjectGroup = 'product' | 'ai' | 'tools' | 'experiments';

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  slug: string;
  name: string;
  group: ProjectGroup;
  /** One line, shown in lists and used as the meta description stem. */
  tagline: string;
  /** `owner/name` on GitHub, when the project has a public repository. */
  repo?: string;
  /** Live product, demo or tool. Only set when the URL is publicly reachable. */
  url?: string;
  /** Shown on the home page. */
  featured?: boolean;
  /** Has its own page at /projects/<slug>. Requires `detail`. */
  detail?: ProjectDetail;
}

export interface ProjectDetail {
  /** Opening paragraphs. */
  intro: string[];
  /** What it does, as short factual points. */
  features: string[];
  /** Technologies named in the README or product site. */
  stack: string[];
  /** Extra sections, rendered in order after the features. */
  sections?: { heading: string; body: string[] }[];
  /** Dated milestones, oldest first. */
  timeline?: { date: string; label: string }[];
  links?: ProjectLink[];
  /** The open-source project this one builds on, when there is one. */
  basedOn?: { name: string; url: string; license: string };
  /** License as shown to readers, when GitHub cannot classify it. */
  licenseNote?: string;
  /** URL of that license. */
  licenseUrl?: string;
}

export const projectGroups: { id: ProjectGroup; label: string; description: string }[] = [
  {
    id: 'product',
    label: 'Products',
    description: 'What I am building at YBX Labs.',
  },
  {
    id: 'ai',
    label: 'AI and chatbots',
    description: 'Bots and apps that put language models where people already talk.',
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Small utilities built to solve one problem well.',
  },
  {
    id: 'experiments',
    label: 'Experiments and templates',
    description: 'Prototypes, plugins and starting points.',
  },
];

export const projects: Project[] = [
  {
    slug: 'flavorgpt',
    name: 'FlavorGPT',
    group: 'product',
    tagline: 'An AI workspace that works with your tools, not just your prompts.',
    url: 'https://flavor-ai.tech',
    featured: true,
    detail: {
      intro: [
        'FlavorGPT is the product I am building at YBX Labs. It is an AI workspace that connects to your databases, APIs and files, then runs agents that reason, write code and ship the result.',
        'It started from a simple frustration: every AI provider locks you into its own models and its own rules. FlavorGPT puts many models behind one workspace, lets you compare them in a single conversation, and lets you stay anonymous while you do it.',
      ],
      features: [
        'Autonomous agents that carry out multi-step work and return finished results.',
        'Multi-model chat: mention several models in one message and compare their answers side by side.',
        'MCP tool integration, so the AI can act on your existing databases, APIs and tools.',
        'A personal knowledge base with retrieval, so answers are grounded in your own data.',
        'Built-in code preview and one-click deploy to a public URL.',
        'Fingerprint sign-in that needs no email address, and a commitment that your data is never used for model training.',
        'A free tier, with public pricing for paid plans.',
      ],
      stack: ['Supabase', 'Stripe', 'OpenRouter', 'Model Context Protocol (MCP)', 'Retrieval-augmented generation (RAG)'],
      timeline: [
        { date: '2024-02', label: 'Repository initialized and the core chat interface built.' },
        { date: '2024-08', label: 'Version 2.0: accounts, billing and streaming chat.' },
        { date: '2024-12', label: 'Version 2.3: file attachments, web search, custom themes and workspace storage.' },
        { date: '2025-06', label: 'Version 2.4: more than 100 models and image generation.' },
        { date: '2026-03', label: 'Version 2.5: enterprise stack, fingerprint sign-in, crypto payments and an admin dashboard.' },
      ],
      sections: [
        {
          heading: 'FlavorAI for enterprises',
          body: [
            'The same architecture powers FlavorAI, the YBX Labs platform for companies. FlavorAI sits between a company’s applications and the language models it uses: it routes each request to a suitable model, can cross-check one model’s output against another, and reports on prompts, token usage and latency.',
            'YBX Labs also offers it as a single API: you connect your own AI providers, such as OpenAI, AWS Bedrock, Claude or OpenRouter, and call all of them through one endpoint in the OpenAI API format.',
          ],
        },
      ],
      links: [
        { label: 'Features', url: 'https://flavor-ai.tech/i/features' },
        { label: 'Pricing', url: 'https://flavor-ai.tech/i/pricing' },
        { label: 'Changelog', url: 'https://flavor-ai.tech/i/changelog' },
        { label: 'FlavorAI at YBX Labs', url: 'https://ybxlabs.com/services/flavorai' },
      ],
    },
  },
  {
    slug: 'whatsapp-ai-bot',
    name: 'Whatsapp-Ai-BOT',
    group: 'ai',
    tagline: 'A WhatsApp chatbot that answers with ChatGPT and draws with DALL·E.',
    repo: 'yesbhautik/Whatsapp-Ai-BOT',
    featured: true,
    detail: {
      intro: [
        'Whatsapp-Ai-BOT turns a WhatsApp number into an AI assistant. Send it a message and it replies with OpenAI’s ChatGPT; ask for a picture and it generates one with DALL·E.',
        'I published it in February 2023, a few months after ChatGPT launched. It puts that kind of assistant inside a chat app people already use every day.',
      ],
      features: [
        'Text conversations through OpenAI’s chat models with the /ai command.',
        'Text-to-image generation through DALL·E with the /img command.',
        'Runs on Node.js and connects to WhatsApp through the Baileys library.',
        'Step-by-step deployment guides for Windows, Linux, macOS and Android (Termux).',
        'A video walkthrough on YouTube.',
      ],
      stack: ['Node.js', 'Baileys', 'OpenAI API', 'ChatGPT', 'DALL·E'],
      sections: [
        {
          heading: 'How it is distributed',
          body: [
            'The public repository ships a free build of the bot under a Creative Commons BY-NC-SA 4.0 license. The code in that build is obfuscated but fully functional.',
            'A paid Prime edition adds readable source, conversation history, GPT-4 and DALL·E 3 support, customization and a license that allows commercial use.',
          ],
        },
      ],
      links: [
        { label: 'Video walkthrough', url: 'https://youtu.be/4lk6IMZ544s' },
        { label: 'Prime edition', url: 'https://pages.razorpay.com/Whatsapp-Ai-BOT' },
      ],
      licenseNote: 'CC BY-NC-SA 4.0 (free build)',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
  },
  {
    slug: 'master-ai-bot',
    name: 'Master AI BOT',
    group: 'ai',
    tagline: 'A self-hosted Telegram AI bot with GPT-4 Turbo, voice messages and 15 chat modes.',
    repo: 'yesbhautik/Master-AI-BOT',
    featured: true,
    detail: {
      intro: [
        'Master AI BOT is a Telegram bot that gives you ChatGPT in a chat window you control. You run it on your own server with your own OpenAI key, so there is no shared quota and no web interface to wait on.',
        'I publish and maintain it, with deployment guides for Linux, macOS and Windows.',
      ],
      features: [
        'Replies stream into the chat as they are generated.',
        'Powered by GPT-4 Turbo through the OpenAI API.',
        'Works in group chats as well as private conversations.',
        'Understands voice messages.',
        'Image generation with DALL·E 2 in Artist mode.',
        'Fifteen chat modes, such as Assistant, Code Assistant, Artist and Psychologist, editable in a single YAML file.',
        'Code highlighting in answers.',
        'Access control through a list of allowed Telegram users.',
        'Tracks what you have spent on the OpenAI API.',
      ],
      stack: ['Python', 'Docker', 'Docker Compose', 'MongoDB', 'OpenAI API', 'Telegram Bot API'],
      sections: [
        {
          heading: 'Commands',
          body: [
            'The bot is driven by six commands: /new starts a conversation, /retry regenerates the last answer, /mode switches chat mode, /balance shows OpenAI spending, /settings opens the settings and /help explains the rest.',
          ],
        },
      ],
      basedOn: {
        name: 'chatgpt_telegram_bot by father-bot',
        url: 'https://github.com/father-bot/chatgpt_telegram_bot',
        license: 'MIT',
      },
    },
  },
  {
    slug: 'talk-with-pdf',
    name: 'Talk with PDF',
    group: 'ai',
    tagline: 'Ask questions about your PDF documents in plain language.',
    repo: 'yesbhautik/Talk-with-PDF',
    detail: {
      intro: [
        'Talk with PDF is a small web app for questioning documents. Upload one or more PDF files, ask what you want to know, and a language model answers from what the documents actually say.',
        'It is meant for researchers, students and anyone else who needs an answer from a long document without reading every page.',
      ],
      features: [
        'Upload and process several PDF documents at once.',
        'Ask questions and hold a conversation about their contents.',
        'Works with OpenAI models, with Hugging Face models as an alternative.',
        'A browser interface built with Streamlit, started with a single command.',
      ],
      stack: ['Python', 'Streamlit', 'OpenAI API', 'Hugging Face'],
    },
  },
  {
    slug: 'tgmoji',
    name: 'TGmoji',
    group: 'tools',
    tagline: 'Convert animated SVGs to GIF and Telegram emoji or stickers, entirely in your browser.',
    repo: 'yesbhautik/TGmoji',
    url: 'https://tgmoji.ybxlabs.com',
    featured: true,
    detail: {
      intro: [
        'TGmoji converts an animated SVG into an animated GIF, a Telegram custom emoji or a Telegram sticker. Everything happens in your browser: there is no server, no upload and no tracking, so your artwork never leaves your device.',
        'Many online converters upload your files to a remote server for processing. An SVG is often a logo or a brand asset you would rather keep to yourself, so TGmoji does all of the work on your own machine.',
      ],
      features: [
        'Animated GIF output with real transparency and configurable dimensions.',
        'Telegram emoji output: VP9 WebM at 100 by 100 pixels, within Telegram’s 256 KB limit.',
        'Telegram sticker output: VP9 WebM with a 512 pixel longest side, scaled to keep the aspect ratio.',
        'Supports both CSS keyframe animations and SMIL animations, including opacity, transforms, strokes, filters and colors.',
        'GIF encoding runs in Web Workers, so the page stays responsive.',
        'A static site with no build step and no dependencies: host it on any web server, or run the Docker image.',
      ],
      stack: ['JavaScript', 'Canvas API', 'Web Animations API', 'MediaRecorder (VP9 WebM)', 'gif.js', 'Web Workers', 'Docker'],
      sections: [
        {
          heading: 'How the conversion works',
          body: [
            'The SVG is loaded into a hidden iframe. For each frame, TGmoji pauses the animation, moves it to an exact point in time through the Web Animations API, copies the computed styles onto a clone of the SVG and draws that clone to a canvas.',
            'The frames are then encoded as a GIF by gif.js in background workers, or as VP9 WebM by the browser’s MediaRecorder. The finished file is created in memory and downloaded directly.',
          ],
        },
        {
          heading: 'Browser support',
          body: [
            'GIF output works in Chrome, Edge, Firefox and Safari. WebM output for Telegram needs Chrome, Edge or Firefox, because Safari cannot record VP9.',
          ],
        },
      ],
    },
  },
  {
    slug: 'xopenapi',
    name: 'XOpenAPI',
    group: 'tools',
    tagline: 'Unofficial JSON endpoints and RSS feeds for public posts on X.',
    repo: 'yesbhautik/XOpenAPI',
    url: 'https://xopenapi.yesbhautik.co.in',
    detail: {
      intro: [
        'XOpenAPI is a small Node.js service that exposes public data from X, formerly Twitter, as simple endpoints. Each endpoint returns JSON, and each has a twin that returns an RSS feed, so a search or an account can be followed from any feed reader.',
        'It is an unofficial project and an early release. It reads X through the open-source Rettiwt API library.',
      ],
      features: [
        'Search posts by keyword, with an optional strict mode.',
        'Search posts by hashtag.',
        'Fetch the profile information of an account.',
        'Fetch the latest post of an account.',
        'Filter results by minimum likes, replies and reposts, and by language.',
        'An RSS version of every endpoint.',
      ],
      stack: ['Node.js', 'Express', 'Rettiwt API', 'RSS'],
    },
  },
  {
    slug: 'public-api-scraper',
    name: 'Public API Scraper',
    group: 'tools',
    tagline: 'Find and verify API keys exposed in public GitHub repositories.',
    repo: 'yesbhautik/Public-API-Scraper',
    detail: {
      intro: [
        'Public API Scraper searches public GitHub repositories for API keys that were committed by mistake, then checks whether each key still works. Its purpose is responsible disclosure: finding leaked keys so that the provider or the owner can be told and the key revoked.',
        'You give it a search keyword, a model identifier and an API endpoint, and it reports what it finds as it goes.',
      ],
      features: [
        'A web interface, so no command-line knowledge is needed after start-up.',
        'Live progress and results, pushed to the browser over WebSocket.',
        'Verifies each key it finds against the endpoint you specify.',
        'Runs from a Docker image built for both AMD64 and ARM64.',
        'Needs only a GitHub personal access token with read access to public repositories.',
      ],
      stack: ['Go', 'WebSocket', 'Docker', 'GitHub API'],
      links: [{ label: 'Docker image', url: 'https://hub.docker.com/r/yesbhautik/public-api-scraper' }],
    },
  },
  {
    slug: 'feedback-flow',
    name: 'Feedback Flow',
    group: 'tools',
    tagline: 'Collect customer feedback with a single QR code scan.',
    repo: 'yesbhautik/feedback-flow',
    url: 'https://feedback-flow-taupe.vercel.app',
    detail: {
      intro: [
        'Feedback Flow makes leaving feedback as easy as scanning a code. The home page shows a QR code; scanning it opens a feedback page on the customer’s phone.',
        'From there a language model drafts a feedback message that fits the context, and the customer can post it to X with one tap.',
      ],
      features: [
        'A QR code generated automatically and linked to the feedback page.',
        'Feedback prompts written by an OpenAI model.',
        'One-tap sharing to X.',
        'A responsive interface that works on any phone.',
      ],
      stack: ['Node.js', 'Express', 'OpenAI API', 'qrcode'],
    },
  },
  {
    slug: 'ttweety-connect',
    name: 'TTweetY Connect',
    group: 'tools',
    tagline: 'Post from Telegram to X automatically.',
    repo: 'yesbhautik/TTweetY-Connect',
    detail: {
      intro: [
        'TTweetY Connect is a bot that carries posts from Telegram to X. Write once in a Telegram channel or group and the same update appears on X, which saves community managers and creators from publishing everything twice.',
      ],
      features: [
        'Text posts, sent to X as written.',
        'Single images or videos with optional captions.',
        'Up to four images in one post, matching the limit on X.',
        'Telegram polls reposted as polls on X.',
        'Keyword filtering, so only the messages you mark are cross-posted.',
        'A choice of which channels and groups the bot listens to.',
        'Checks each post against the rules of X before sending, and reports any failure back in Telegram.',
      ],
      stack: ['Node.js', 'node-telegram-bot-api', 'twitter-api-v2'],
    },
  },
  {
    slug: 'wa-contact',
    name: 'WA-contact',
    group: 'tools',
    tagline: 'Export, clean and analyze your WhatsApp contacts.',
    repo: 'yesbhautik/WA-contact',
    detail: {
      intro: [
        'WA-contact exports the contacts in your own WhatsApp account, from private chats and from every group you belong to, and turns them into clean files you can work with.',
        'It is a work in progress: the export and the cleaning work, while categorization and the PDF layout are still being improved.',
      ],
      features: [
        'Exports contacts from personal chats and from groups.',
        'Cleans and formats the raw data automatically.',
        'Writes JSON, CSV and PDF files.',
        'Groups contacts into categories by keyword.',
      ],
      stack: ['Node.js', 'Baileys', 'PDFKit'],
    },
  },
  {
    slug: 'osmo360',
    name: 'Osmo360',
    group: 'experiments',
    tagline: 'An unofficial Android prototype for live preview from the DJI Osmo 360 camera.',
    repo: 'yesbhautik/osmo360',
    detail: {
      intro: [
        'Osmo360 is an Android app prototype that shows a live preview from a DJI Osmo 360 camera. I use that camera myself and wanted to see what it takes to connect to it from a native app.',
        'It is an independent project for developers to experiment with. It is not affiliated with or endorsed by DJI, and it is meant for cameras you own.',
      ],
      features: [
        'Finds and wakes the camera over Bluetooth Low Energy.',
        'Joins the camera’s Wi-Fi network from inside the app.',
        'Decodes the H.264 stream on the phone with Android’s MediaCodec and renders the preview.',
        'Connection settings are entered in the app and stored only on the device.',
        'Clear states for troubleshooting Bluetooth, Wi-Fi visibility and camera discovery.',
        'Documentation in English, Chinese and Russian.',
      ],
      stack: ['Java', 'Android', 'Bluetooth Low Energy', 'Wi-Fi', 'H.264', 'MediaCodec'],
    },
  },
  {
    slug: 'javagpt',
    name: 'JavaGPT',
    group: 'ai',
    tagline: 'A desktop chat client for OpenAI models, written in Java.',
    repo: 'yesbhautik/JavaGPT',
    detail: {
      intro: [
        'JavaGPT is a desktop chat client written in Java. It sends your questions to OpenAI’s GPT models, shows the answers in a chat window and keeps the conversation history in a MySQL database.',
        'The repository documents its own design with a workflow diagram and a written explanation, which makes it a readable example of a JavaFX application wired to a language model.',
      ],
      features: [
        'A chat interface built with JavaFX.',
        'Answers generated by OpenAI’s GPT models.',
        'Conversation history stored in MySQL.',
        'An interface that can be restyled with CSS.',
      ],
      stack: ['Java 17', 'JavaFX', 'Maven', 'MySQL', 'OpenAI API'],
    },
  },
  {
    slug: 'espanso-writingai',
    name: 'Espanso WritingAI',
    group: 'tools',
    tagline: 'An Espanso package that rewrites the text you copied into clear English, with one shortcut.',
    repo: 'yesbhautik/Espanso-WritingAI',
  },
  {
    slug: 'links',
    name: 'Links',
    group: 'experiments',
    tagline: 'A custom link-in-bio page, running at links.yesbhautik.co.in.',
    repo: 'yesbhautik/links',
    url: 'https://links.yesbhautik.co.in',
  },
  {
    slug: 'works-studio',
    name: 'Works Studio',
    group: 'experiments',
    tagline: 'An open-source template for showcasing work, made for agencies and individuals.',
    repo: 'YBXLabs/works-studio',
  },
  {
    slug: 'in-startup-funding-analysis',
    name: 'Indian startup funding analysis',
    group: 'experiments',
    tagline: 'Interactive charts of Indian startup funding by company and investor, built with Streamlit.',
    repo: 'yesbhautik/IN-StartupFunding-analysis',
  },
  {
    slug: 'telegram-webapp-mod',
    name: 'Telegram WebApp mod',
    group: 'experiments',
    tagline: 'Run mobile-only Telegram web apps in a desktop browser.',
    repo: 'yesbhautik/telegram-webapp-mod',
  },
  {
    slug: 'torrent-to-google-drive',
    name: 'Torrent to Google Drive',
    group: 'experiments',
    tagline: 'A Google Colab notebook that saves a torrent straight to Google Drive.',
    repo: 'yesbhautik/torrent-to-google-drive',
  },
  {
    slug: 'click-fun',
    name: 'click.fun',
    group: 'experiments',
    tagline: 'A Windows app that counts your mouse clicks and key presses.',
    repo: 'yesbhautik/click.fun',
  },
  {
    slug: 'bb-social-share',
    name: 'BB Social Share',
    group: 'experiments',
    tagline: 'A WordPress plugin that adds social sharing buttons to WooCommerce product pages.',
    repo: 'yesbhautik/bb-social-share',
  },
];

export const detailProjects = projects.filter((project) => project.detail);
export const featuredProjects = projects.filter((project) => project.featured);

export function projectPath(project: Project): string | undefined {
  return project.detail ? `/projects/${project.slug}` : undefined;
}
