import type { APIRoute } from 'astro';
import {
  bios,
  booking,
  company,
  credentials,
  faqs,
  githubStats,
  links,
  milestones,
  person,
  products,
  services,
  speaking,
  topics,
} from '@/data/profile.ts';
import { projects } from '@/data/projects.ts';
import { SITE, absoluteUrl } from '@/data/site.ts';
import { repoSnapshot } from '@/lib/github.ts';
import { ids, projectUrl } from '@/lib/schema.ts';

/**
 * The facts about Bhautik as plain JSON, for programs that would rather not
 * read HTML. It is built from the same data as the pages and the JSON-LD.
 */
export const GET: APIRoute = () => {
  const stats = githubStats();
  const bio = bios();

  const profile = {
    '@id': ids.person,
    name: person.name,
    givenName: person.givenName,
    familyName: person.familyName,
    alternateNames: [person.alias, person.handle],
    handle: person.handle,
    role: person.role,
    jobTitle: person.jobTitle,
    location: {
      city: person.location.city,
      region: person.location.region,
      country: person.location.country,
      countryCode: person.location.countryCode,
    },
    email: person.email,
    website: `${SITE.url}/`,
    image: absoluteUrl(person.headshot),
    bio: { oneLine: bio.oneLine, short: bio.short, long: bio.long.join('\n\n') },
    topics: topics.map((topic) => topic.name),
    company: {
      name: company.name,
      formerName: company.formerName,
      url: company.url,
      role: person.jobTitle,
      description: company.summary,
      location: company.location,
      udyamRegistration: company.udyam,
      profiles: company.profiles,
      services: company.services.map(({ name, summary, url }) => ({ name, summary, url })),
    },
    products: Object.values(products).map(({ name, url, summary }) => ({ name, url, summary })),
    services: services.map(({ id, name, summary }) => ({
      name,
      summary,
      url: `${absoluteUrl('/services')}#${id}`,
    })),
    speaking: {
      topics: speaking.topics,
      formats: speaking.formats,
      url: absoluteUrl('/speaking'),
    },
    booking: {
      profile: booking.profile,
      quickChat: { duration: booking.quickChat.duration, medium: booking.quickChat.medium, url: booking.quickChat.url },
      consultation: {
        duration: booking.consultation.duration,
        medium: booking.consultation.medium,
        url: booking.consultation.url,
      },
    },
    links: links.map(({ label, handle, url, group }) => ({ label, handle, url, active: group !== 'inactive' })),
    github: {
      url: `https://github.com/${person.handle}`,
      memberSince: stats.sinceDate.slice(0, 10),
      stars: stats.stars,
      forks: stats.forks,
      publicSourceRepositories: stats.sourceRepos,
      followers: stats.followers,
      asOf: stats.asOf,
    },
    projects: projects.map((project) => {
      const repo = repoSnapshot(project.repo);
      return {
        name: project.name,
        description: project.tagline,
        url: projectUrl(project),
        ...(project.url ? { live: project.url } : {}),
        ...(repo
          ? {
              repository: repo.url,
              stars: repo.stars,
              forks: repo.forks,
              language: repo.language,
              license: repo.license,
              firstPublished: repo.createdAt.slice(0, 10),
            }
          : {}),
      };
    }),
    credentials: credentials.map(({ name, issuer, issued, url }) => ({ name, issuer, issued, url })),
    milestones: milestones.map(({ date, label, source }) => ({ date, event: label, source })),
    faq: faqs(),
    meta: {
      source: `${SITE.url}/`,
      license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      contentSignal: 'search=yes, ai-input=yes, ai-train=yes',
      related: {
        llmsTxt: absoluteUrl('/llms.txt'),
        llmsFullTxt: absoluteUrl('/llms-full.txt'),
        sitemap: absoluteUrl('/sitemap.xml'),
        pressKit: absoluteUrl('/press'),
      },
    },
  };

  return new Response(`${JSON.stringify(profile, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
