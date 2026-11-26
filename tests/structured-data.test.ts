/**
 * The JSON-LD on every page must be valid, connected, and say only what the
 * visible page says. Search engines require the last part; the first two are
 * what make the data usable at all.
 */
import { describe, expect, it } from 'vitest';
import { links, person } from '../src/data/profile.ts';
import { github } from '../src/lib/github.ts';
import { Site, canonicalOf, graphNodes, normalize, typesOf, walk, type BuiltPage } from './helpers.ts';

const site = new Site();
const indexable = site.indexable;
const PERSON = 'https://yesbhautik.co.in/#person';

const byType = (page: BuiltPage, type: string) => graphNodes(page).filter((node) => typesOf(node).includes(type));
const one = (page: BuiltPage, type: string) => {
  const found = byType(page, type);
  expect(found, `${page.path} should have exactly one ${type}`).toHaveLength(1);
  return found[0]!;
};

/** Text a visitor can read: the main content, without tags, with whitespace collapsed. */
const visible = (page: BuiltPage) => normalize(page.text);

describe.each(indexable.map((page) => [page.path, page] as const))('%s', (path, page) => {
  const nodes = graphNodes(page);

  it('has one JSON-LD block with a schema.org graph', () => {
    expect(page.jsonLd).toHaveLength(1);
    const block = page.jsonLd[0] as Record<string, unknown>;
    expect(block['@context']).toBe('https://schema.org');
    expect(Array.isArray(block['@graph'])).toBe(true);
  });

  it('gives every node a type and a unique @id', () => {
    const ids = nodes.map((node) => node['@id']).filter(Boolean);
    expect(new Set(ids).size, 'duplicate @id').toBe(ids.length);
    for (const node of nodes) expect(typesOf(node).length, JSON.stringify(node).slice(0, 80)).toBeGreaterThan(0);
  });

  it('resolves every reference inside the same graph', () => {
    const ids = new Set(nodes.map((node) => node['@id']));
    walk(nodes, (value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        if (keys.length === 1 && keys[0] === '@id') {
          expect(ids, `dangling reference to ${(value as { '@id': string })['@id']}`).toContain(
            (value as { '@id': string })['@id'],
          );
        }
      }
    });
  });

  it('has no empty values', () => {
    walk(nodes, (value, key) => {
      expect(value, `${key} is null`).not.toBeNull();
      if (typeof value === 'string') expect(value.trim(), `${key} is empty`).not.toBe('');
      if (Array.isArray(value)) expect(value.length, `${key} is an empty list`).toBeGreaterThan(0);
    });
  });

  it('describes the site, the person and the page itself', () => {
    const website = one(page, 'WebSite');
    expect(website.url).toBe('https://yesbhautik.co.in/');

    const who = one(page, 'Person');
    expect(who['@id']).toBe(PERSON);
    expect(who.name).toBe(person.name);
    expect(who.url).toBe('https://yesbhautik.co.in/');

    const webPage = nodes.find((node) => node['@id'] === `${canonicalOf(path)}#webpage`);
    expect(webPage, 'no node for the page itself').toBeDefined();
    expect(webPage!.url).toBe(page.canonical);
    expect(webPage!.name).toBe(page.title);
    expect(webPage!.description).toBe(page.description);
    expect((webPage!.isPartOf as { '@id': string })['@id']).toBe(website['@id']);
  });

  it('has a breadcrumb that leads to real pages, when it is not the home page', () => {
    if (path === '/') return;
    const crumbs = one(page, 'BreadcrumbList').itemListElement as { position: number; name: string; item: string }[];
    expect(crumbs[0]).toMatchObject({ position: 1, name: 'Home', item: 'https://yesbhautik.co.in/' });
    crumbs.forEach((crumb, index) => {
      expect(crumb.position).toBe(index + 1);
      const target = crumb.item.replace('https://yesbhautik.co.in', '') || '/';
      expect(site.serves(target), `breadcrumb points to ${crumb.item}`).toBe(true);
    });
    expect(crumbs.at(-1)!.item).toBe(page.canonical);
  });

  it('uses only absolute https URLs', () => {
    walk(nodes, (value, key) => {
      if (typeof value !== 'string' || !key) return;
      if (['url', 'item', 'sameAs', 'codeRepository', 'contentUrl', 'license', 'isBasedOn', 'serviceUrl'].includes(key)) {
        expect(value, `${key}: ${value}`).toMatch(/^https:\/\//);
      }
    });
  });
});

describe('the person', () => {
  const home = site.page('/');
  const who = byType(home, 'Person')[0]!;

  it('is the main entity of the home page, which is a profile page', () => {
    const profile = one(home, 'ProfilePage');
    expect((profile.mainEntity as { '@id': string })['@id']).toBe(PERSON);
  });

  it('lists exactly the profiles that are marked as his', () => {
    expect(who.sameAs).toEqual(links.filter((link) => link.sameAs).map((link) => link.url));
  });

  it('links to every one of those profiles somewhere a visitor can click', () => {
    const hrefs = new Set(
      site.pages.flatMap((page) => page.root.querySelectorAll('a[href]').map((a) => a.getAttribute('href'))),
    );
    for (const url of who.sameAs as string[]) expect(hrefs, url).toContain(url);
  });

  it('states a role, an employer and a location that the page also shows', () => {
    const text = visible(home);
    expect(text).toContain(person.name);
    expect(text).toContain(String(who.jobTitle));
    expect(text).toContain('YBX Labs');
    expect(text).toContain(person.location.label);
    const company = one(home, 'Organization');
    expect((who.worksFor as { '@id': string })['@id']).toBe(company['@id']);
    expect((company.founder as { '@id': string })['@id']).toBe(PERSON);
  });

  it('has credentials that the about page shows, each with a verification link', () => {
    const about = site.page('/about');
    const credentials = byType(about, 'Person')[0]!.hasCredential as { name: string; url: string }[];
    expect(credentials.length).toBeGreaterThan(0);
    const hrefs = about.root.querySelectorAll('a[href]').map((a) => a.getAttribute('href'));
    for (const credential of credentials) {
      expect(visible(about)).toContain(credential.name);
      expect(hrefs).toContain(credential.url);
    }
  });
});

describe('page-specific data mirrors the page', () => {
  it('about: every question and answer in the data is on the page, word for word', () => {
    const about = site.page('/about');
    const pageNode = graphNodes(about).find((node) => typesOf(node).includes('FAQPage'))!;
    const questions = pageNode.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(questions.length).toBeGreaterThanOrEqual(5);
    const text = visible(about);
    for (const question of questions) {
      expect(text).toContain(normalize(question.name));
      expect(text).toContain(normalize(question.acceptedAnswer.text));
    }
  });

  it('services: every service in the data is described on the page', () => {
    const services = site.page('/services');
    const nodes = byType(services, 'Service');
    expect(nodes.length).toBeGreaterThanOrEqual(4);
    const text = visible(services);
    for (const node of nodes) {
      expect(text).toContain(String(node.name));
      expect(text).toContain(normalize(String(node.description)));
      expect((node.provider as { '@id': string })['@id']).toBe(PERSON);
    }
  });

  it('projects: the list in the data matches the projects on the page', () => {
    const projects = site.page('/projects');
    const list = one(projects, 'ItemList');
    const items = list.itemListElement as { position: number; name: string; url: string }[];
    expect(list.numberOfItems).toBe(items.length);
    const text = visible(projects);
    const hrefs = projects.root.querySelectorAll('main a[href]').map((a) => a.getAttribute('href'));
    items.forEach((item, index) => {
      expect(item.position).toBe(index + 1);
      expect(text).toContain(item.name);
      const href = item.url.replace('https://yesbhautik.co.in', '');
      expect(hrefs, `${item.name} is not linked from the page`).toContain(href);
    });
  });

  it.each(site.indexable.filter((page) => page.path.startsWith('/projects/')).map((page) => [page.path, page] as const))(
    '%s: the software entity matches the page and the GitHub snapshot',
    (_path, page) => {
      const entity = graphNodes(page).find((node) =>
        typesOf(node).some((type) => ['SoftwareSourceCode', 'WebApplication'].includes(type)),
      )!;
      expect(entity, 'no software entity').toBeDefined();
      const text = visible(page);
      expect(text).toContain(String(entity.name));
      expect(text).toContain(normalize(String(entity.description)));

      if (typeof entity.codeRepository === 'string') {
        const repo = Object.values(github.repos).find((item) => item.url === entity.codeRepository);
        expect(repo, `${entity.codeRepository} is not in the snapshot`).toBeDefined();
        expect(page.root.querySelectorAll('a[href]').map((a) => a.getAttribute('href'))).toContain(repo!.url);
        if (entity.programmingLanguage) expect(text).toContain(String(entity.programmingLanguage));
      }
    },
  );

  it('speaking: no events are published unless a talk is on record', () => {
    const speaking = site.page('/speaking');
    const events = byType(speaking, 'Event');
    const listed = speaking.root.querySelectorAll('#talks').length > 0;
    expect(events.length > 0).toBe(listed);
  });
});
