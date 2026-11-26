/**
 * Builds the JSON-LD for every page as one connected graph.
 *
 * Each entity has a stable `@id`, so the person on the home page, the author
 * of a project and the provider of a service are the same node everywhere.
 * Every value comes from the same data the visible page is rendered from:
 * structured data here never says something the page does not.
 */
import type {
  BlogPostingLeaf,
  BreadcrumbListLeaf,
  EventLeaf,
  Graph,
  ImageObjectLeaf,
  ItemListLeaf,
  OrganizationLeaf,
  PersonLeaf,
  QuestionLeaf,
  ServiceLeaf,
  SoftwareSourceCodeLeaf,
  Thing,
  WebApplicationLeaf,
  WebSiteLeaf,
} from 'schema-dts';
import { booking, company, credentials, links, person, products, services, topics, type Faq } from '../data/profile.ts';
import { projects, type Project } from '../data/projects.ts';
import { SITE, absoluteUrl } from '../data/site.ts';
import { repoSnapshot } from './github.ts';
import { lastModified } from './lastmod.ts';
import { OG_IMAGE, ogImageUrl } from './seo.ts';

const root = SITE.url;

export const ids = {
  person: `${root}/#person`,
  website: `${root}/#website`,
  company: `${root}/#ybx-labs`,
  flavorgpt: `${root}/#flavorgpt`,
  headshot: `${root}/#headshot`,
  webpage: (path: string) => `${absoluteUrl(path)}#webpage`,
  breadcrumb: (path: string) => `${absoluteUrl(path)}#breadcrumb`,
  project: (slug: string) => (slug === 'flavorgpt' ? `${root}/#flavorgpt` : `${root}/projects/${slug}#project`),
  service: (id: string) => `${root}/services#${id}`,
} as const;

const ref = (id: string) => ({ '@id': id });

const flavorgptProject = projects.find((project) => project.slug === 'flavorgpt')!;

const LICENSE_CONTENT = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';

export function headshotNode(): ImageObjectLeaf {
  const url = absoluteUrl(person.headshot);
  return {
    '@type': 'ImageObject',
    '@id': ids.headshot,
    url,
    contentUrl: url,
    caption: `Portrait of ${person.name}`,
    creditText: person.name,
    copyrightNotice: `© ${person.name}`,
    creator: ref(ids.person),
    license: LICENSE_CONTENT,
    acquireLicensePage: absoluteUrl('/press'),
  };
}

/**
 * The short form goes on every page; the full form on the pages that are about him.
 * A description is included only when the page prints that same text.
 */
export function personNode(detail: 'full' | 'compact' = 'compact', description?: string): PersonLeaf {
  const base: PersonLeaf = {
    '@type': 'Person',
    '@id': ids.person,
    name: person.name,
    alternateName: [person.alias, person.handle],
    url: `${root}/`,
    image: ref(ids.headshot),
    jobTitle: person.jobTitle,
    worksFor: ref(ids.company),
    sameAs: links.filter((link) => link.sameAs).map((link) => link.url),
  };
  if (detail === 'compact') return base;

  return {
    ...base,
    givenName: person.givenName,
    familyName: person.familyName,
    ...(description ? { description } : {}),
    email: person.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: person.location.city,
      addressRegion: person.location.region,
      addressCountry: person.location.countryCode,
    },
    knowsAbout: topics.map((topic) =>
      topic.sameAs ? { '@type': 'Thing', name: topic.name, sameAs: topic.sameAs } : topic.name,
    ),
    hasCredential: credentials.map((credential) => ({
      '@type': 'EducationalOccupationalCredential',
      name: credential.name,
      credentialCategory: 'Training badge',
      dateCreated: credential.issued,
      url: credential.url,
      recognizedBy: { '@type': 'Organization', name: credential.issuer },
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'business inquiries',
      email: person.email,
      url: booking.profile,
    },
    mainEntityOfPage: `${root}/`,
  };
}

/** The company's identity goes on every page; its registration number on the page that prints it. */
export function companyNode(withRegistration = false): OrganizationLeaf {
  return {
    '@type': 'Organization',
    '@id': ids.company,
    name: company.name,
    alternateName: company.formerName,
    url: company.url,
    founder: ref(ids.person),
    sameAs: Object.values(company.profiles),
    ...(withRegistration
      ? {
          address: { '@type': 'PostalAddress', addressRegion: 'Gujarat', addressCountry: 'IN' },
          identifier: { '@type': 'PropertyValue', propertyID: 'Udyam Registration Number', value: company.udyam },
        }
      : {}),
  };
}

export function flavorgptNode(): WebApplicationLeaf {
  return {
    '@type': 'WebApplication',
    '@id': ids.flavorgpt,
    name: products.flavorgpt.name,
    url: products.flavorgpt.url,
    description: flavorgptProject.tagline,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser',
    creator: ref(ids.person),
    publisher: ref(ids.company),
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', description: 'Free tier' },
  };
}

export function websiteNode(): WebSiteLeaf {
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${root}/`,
    name: SITE.name,
    alternateName: [SITE.alternateName, SITE.host],
    inLanguage: SITE.language,
    publisher: ref(ids.person),
    copyrightHolder: ref(ids.person),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbNode(path: string, trail: Crumb[]): BreadcrumbListLeaf {
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(path),
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export type WebPageType =
  | 'WebPage'
  | 'ProfilePage'
  | 'AboutPage'
  | 'ContactPage'
  | 'CollectionPage'
  | 'ItemPage'
  | 'FAQPage'
  | 'Blog';

export interface WebPageOptions {
  path: string;
  title: string;
  description: string;
  type?: WebPageType | WebPageType[];
  /** What the page is about. Defaults to the person. */
  about?: string;
  /** `@id` of the page's main entity, or inline nodes such as FAQ questions. */
  mainEntity?: string | Thing[];
  hasBreadcrumb?: boolean;
  datePublished?: string;
  dateModified?: string;
}

export function webPageNode(options: WebPageOptions): Thing {
  const { path, type = 'WebPage', mainEntity } = options;
  const dateModified = options.dateModified ?? lastModified(path);
  const node = {
    '@type': type,
    '@id': ids.webpage(path),
    url: absoluteUrl(path),
    name: options.title,
    description: options.description,
    inLanguage: SITE.language,
    isPartOf: ref(ids.website),
    about: ref(options.about ?? ids.person),
    ...(mainEntity ? { mainEntity: typeof mainEntity === 'string' ? ref(mainEntity) : mainEntity } : {}),
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: ogImageUrl(path),
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    },
    ...(options.hasBreadcrumb ? { breadcrumb: ref(ids.breadcrumb(path)) } : {}),
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
  // schema-dts models one type per node; pages such as About carry two.
  return node as unknown as Thing;
}

export function serviceNodes(): ServiceLeaf[] {
  return services.map((service) => ({
    '@type': 'Service',
    '@id': ids.service(service.id),
    name: service.name,
    description: service.body,
    serviceType: service.type,
    url: `${absoluteUrl('/services')}#${service.id}`,
    provider: ref(ids.person),
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    availableChannel: { '@type': 'ServiceChannel', serviceUrl: booking.quickChat.url },
  }));
}

export function questionNodes(faqs: Faq[]): QuestionLeaf[] {
  return faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  }));
}

const spdxUrl = (id: string) => `https://spdx.org/licenses/${id}.html`;

/** The page a project lives at: its own page when it has one, otherwise its repository or product. */
export function projectUrl(project: Project): string {
  if (project.detail) return absoluteUrl(`/projects/${project.slug}`);
  return repoSnapshot(project.repo)?.url ?? project.url ?? absoluteUrl('/projects');
}

export function projectNode(project: Project): SoftwareSourceCodeLeaf | WebApplicationLeaf {
  if (project.slug === 'flavorgpt') return flavorgptNode();

  const repo = repoSnapshot(project.repo);
  const license = project.detail?.licenseUrl ?? (repo?.license ? spdxUrl(repo.license) : undefined);
  return {
    '@type': 'SoftwareSourceCode',
    '@id': ids.project(project.slug),
    name: project.name,
    description: project.tagline,
    url: projectUrl(project),
    author: ref(ids.person),
    maintainer: ref(ids.person),
    ...(repo ? { codeRepository: repo.url, dateCreated: repo.createdAt, dateModified: repo.pushedAt } : {}),
    ...(repo?.language ? { programmingLanguage: repo.language } : {}),
    ...(license ? { license } : {}),
    ...(project.detail?.stack.length ? { keywords: project.detail.stack.join(', ') } : {}),
    ...(project.detail?.basedOn ? { isBasedOn: project.detail.basedOn.url } : {}),
    ...(project.url ? { targetProduct: { '@type': 'WebApplication', name: project.name, url: project.url } } : {}),
  };
}

export function projectListNode(): ItemListLeaf {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl('/projects')}#list`,
    name: `Projects by ${person.name}`,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: project.name,
      url: projectUrl(project),
    })),
  };
}

export interface TalkSchemaInput {
  id: string;
  title: string;
  event: string;
  eventUrl?: string | undefined;
  date: Date;
  location: string;
  online: boolean;
  recording?: string | undefined;
}

export function talkNode(talk: TalkSchemaInput): EventLeaf {
  return {
    '@type': 'Event',
    '@id': `${absoluteUrl('/speaking')}#${talk.id}`,
    name: `${talk.title} (${talk.event})`,
    startDate: talk.date.toISOString().slice(0, 10),
    eventAttendanceMode: talk.online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: talk.online
      ? { '@type': 'VirtualLocation', url: talk.eventUrl ?? absoluteUrl('/speaking') }
      : { '@type': 'Place', name: talk.location, address: talk.location },
    performer: ref(ids.person),
    organizer: { '@type': 'Organization', name: talk.event, ...(talk.eventUrl ? { url: talk.eventUrl } : {}) },
    ...(talk.eventUrl ? { url: talk.eventUrl } : {}),
    ...(talk.recording ? { recordedIn: { '@type': 'VideoObject', url: talk.recording, name: talk.title } } : {}),
  };
}

export interface PostSchemaInput {
  path: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  tags: string[];
}

export function blogPostingNode(post: PostSchemaInput): BlogPostingLeaf {
  return {
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(post.path)}#article`,
    headline: post.title,
    description: post.description,
    url: absoluteUrl(post.path),
    mainEntityOfPage: ref(ids.webpage(post.path)),
    datePublished: post.published.toISOString(),
    dateModified: (post.updated ?? post.published).toISOString(),
    author: ref(ids.person),
    publisher: ref(ids.person),
    image: ogImageUrl(post.path),
    inLanguage: SITE.language,
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
  };
}

export interface PageGraphOptions extends WebPageOptions {
  /** Breadcrumb trail after "Home". The page itself is the last crumb. */
  trail?: Crumb[];
  /** Emit the full person: contact details, subjects, credentials. */
  fullPerson?: boolean;
  /** A bio of the person that this page prints word for word. */
  personDescription?: string;
  /** Include the company's registration, on the page that prints it. */
  companyRegistration?: boolean;
  /** Further nodes for this page. */
  nodes?: Thing[];
}

/** The graph for one page: the site, the person, the page, its breadcrumb, and anything page-specific. */
export function pageGraph(options: PageGraphOptions): Graph {
  const { trail, fullPerson = false, personDescription, companyRegistration = false, nodes = [], ...page } = options;
  const graph: Thing[] = [
    websiteNode(),
    personNode(fullPerson ? 'full' : 'compact', personDescription),
    headshotNode(),
    companyNode(companyRegistration),
    webPageNode({ ...page, hasBreadcrumb: Boolean(trail?.length) }),
  ];
  if (trail?.length) {
    graph.push(breadcrumbNode(page.path, [{ name: 'Home', path: '/' }, ...trail]));
  }
  graph.push(...nodes);

  // The same entity can be asked for twice (the product on its own page, say). Keep the first.
  const seen = new Set<string>();
  const unique = graph.filter((node) => {
    const id = typeof node === 'object' && '@id' in node ? (node['@id'] as string | undefined) : undefined;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return { '@context': 'https://schema.org', '@graph': unique };
}
