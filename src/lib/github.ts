import snapshot from '../data/github.json' with { type: 'json' };

export interface RepoSnapshot {
  fullName: string;
  url: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  /** SPDX identifier, or null when GitHub cannot classify the license. */
  license: string | null;
  topics: string[];
  createdAt: string;
  pushedAt: string;
  archived: boolean;
}

export interface GitHubSnapshot {
  /** Date the numbers were read from GitHub, as YYYY-MM-DD (UTC). */
  fetchedAt: string;
  user: {
    login: string;
    id: number;
    name: string | null;
    url: string;
    followers: number;
    publicRepos: number;
    createdAt: string;
  };
  totals: {
    /** Public repositories the account created rather than forked. */
    sourceRepos: number;
    stars: number;
    forks: number;
  };
  repos: Record<string, RepoSnapshot>;
}

export const github = snapshot as GitHubSnapshot;

export function repoSnapshot(fullName: string | undefined): RepoSnapshot | undefined {
  return fullName ? github.repos[fullName] : undefined;
}

/**
 * Star and fork counts are shown once a repository has an audience worth
 * reporting. Below that they say nothing about the project, so pages list the
 * language, license and year instead.
 */
export function showsCounts(repo: RepoSnapshot | undefined): repo is RepoSnapshot {
  return repo !== undefined && repo.stars >= 10;
}
