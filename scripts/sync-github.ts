/**
 * Refreshes src/data/github.json from the GitHub API.
 *
 * The site never calls GitHub while it builds. It reads this snapshot, so
 * builds are repeatable and every published number can be traced to a date.
 * The file is only rewritten when a number or a repository field changes.
 *
 *   pnpm sync:github
 *
 * Set GITHUB_TOKEN (or GH_TOKEN) to raise the API rate limit. No token is
 * needed for the few requests this makes.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { projects } from '../src/data/projects.ts';
import type { GitHubSnapshot, RepoSnapshot } from '../src/lib/github.ts';

const USER = 'yesbhautik';
const OUT = new URL('../src/data/github.json', import.meta.url);
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

interface ApiRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  fork: boolean;
  private: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string | null } | null;
  topics?: string[];
  created_at: string;
  pushed_at: string;
}

interface ApiUser {
  login: string;
  id: number;
  name: string | null;
  html_url: string;
  followers: number;
  public_repos: number;
  created_at: string;
}

async function gh<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'yesbhautik.co.in-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} returned ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

async function listOwnedRepos(): Promise<ApiRepo[]> {
  const all: ApiRepo[] = [];
  for (let page = 1; ; page++) {
    const batch = await gh<ApiRepo[]>(`/users/${USER}/repos?type=owner&per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

function toSnapshot(repo: ApiRepo): RepoSnapshot {
  const license = repo.license?.spdx_id;
  return {
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description?.trim() || null,
    homepage: repo.homepage?.trim() || null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    license: license && license !== 'NOASSERTION' ? license : null,
    topics: [...(repo.topics ?? [])].sort(),
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    archived: repo.archived,
  };
}

async function main() {
  const [user, owned] = await Promise.all([gh<ApiUser>(`/users/${USER}`), listOwnedRepos()]);

  // "Source" repositories are public ones the account created rather than forked.
  const source = owned.filter((repo) => !repo.fork && !repo.private);
  const byName = new Map(source.map((repo) => [repo.full_name.toLowerCase(), repo]));

  const repos: Record<string, RepoSnapshot> = {};
  for (const project of projects) {
    if (!project.repo) continue;
    const key = project.repo.toLowerCase();
    // Repositories under another owner (the YBX Labs organization) are fetched one by one.
    const repo = byName.get(key) ?? (await gh<ApiRepo>(`/repos/${project.repo}`));
    repos[project.repo] = toSnapshot(repo);
  }

  const data: Omit<GitHubSnapshot, 'fetchedAt'> = {
    user: {
      login: user.login,
      id: user.id,
      name: user.name,
      url: user.html_url,
      followers: user.followers,
      publicRepos: user.public_repos,
      createdAt: user.created_at,
    },
    totals: {
      sourceRepos: source.length,
      stars: source.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      forks: source.reduce((sum, repo) => sum + repo.forks_count, 0),
    },
    repos: Object.fromEntries(Object.entries(repos).sort(([a], [b]) => a.localeCompare(b))),
  };

  let previous: GitHubSnapshot | undefined;
  try {
    previous = JSON.parse(await readFile(OUT, 'utf8')) as GitHubSnapshot;
  } catch {
    previous = undefined;
  }

  if (previous) {
    const { fetchedAt: _ignored, ...previousData } = previous;
    if (JSON.stringify(previousData) === JSON.stringify(data)) {
      console.log(`GitHub snapshot unchanged (${previous.fetchedAt}).`);
      return;
    }
  }

  const snapshot: GitHubSnapshot = { fetchedAt: new Date().toISOString().slice(0, 10), ...data };
  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `GitHub snapshot written: ${data.totals.stars} stars, ${data.totals.forks} forks, ${data.totals.sourceRepos} source repositories.`,
  );
}

await main();
