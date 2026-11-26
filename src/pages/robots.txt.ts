import type { APIRoute } from 'astro';
import { absoluteUrl } from '@/data/site.ts';

/**
 * Everything on this site may be crawled, indexed, quoted by AI assistants and
 * used to train models. The Content-Signal line says so in the vocabulary of
 * contentsignals.org, and the crawlers that matter are named so that there is
 * no doubt the permission covers them.
 */
const SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=yes';

const SEARCH_ENGINES = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot', 'Baiduspider'];

const AI_ASSISTANTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'DuckAssistBot',
  'MistralAI-User',
  'meta-externalfetcher',
  'Amazonbot',
];

const AI_TRAINING = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'CCBot',
  'Bytespider',
  'cohere-ai',
];

const POLICY = `# As a condition of accessing this website, you agree to abide by the
# following content signals:

# (a)  If a content-signal = yes, you may collect content for the
#      corresponding use.
# (b)  If a content-signal = no, you may not collect content for the
#      corresponding use.
# (c)  If the website operator does not include a content signal for a
#      corresponding use, the website operator neither grants nor restricts
#      permission via content signal with respect to the corresponding use.

# The content signals and their meanings are:

# search: building a search index and providing search results (e.g., returning
#         hyperlinks and short excerpts from your website's contents). Search
#         does not include providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models (e.g., retrieval
#           augmented generation, grounding, or other real-time taking of
#           content for generative AI search answers).
# ai-train: training or fine-tuning AI models.

# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF
# RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT
# AND RELATED RIGHTS IN THE DIGITAL SINGLE MARKET.`;

const group = (comment: string, agents: string[]) =>
  [`# ${comment}`, ...agents.map((agent) => `User-agent: ${agent}`), SIGNAL, 'Allow: /'].join('\n');

export const GET: APIRoute = () => {
  const body = [
    POLICY,
    ['User-agent: *', SIGNAL, 'Allow: /'].join('\n'),
    group('Search engines', SEARCH_ENGINES),
    group('AI search and assistants, fetching pages to answer a question', AI_ASSISTANTS),
    group('AI training crawlers', AI_TRAINING),
    [
      `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
      '',
      `# A guide to this site for language models: ${absoluteUrl('/llms.txt')}`,
      '# Every page is also available as Markdown: add .md to its address.',
    ].join('\n'),
  ].join('\n\n');

  return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
