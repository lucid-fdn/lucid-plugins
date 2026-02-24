import { BaseProvider } from './base.js';
import type { CandidateSearchParams, CandidateProfile } from '../types/provider.js';
import type { Candidate } from '../types/database.js';
import { logger } from '../utils/logger.js';

export class GitHubProvider extends BaseProvider {
  readonly name = 'github';
  private token: string;

  constructor(token?: string) {
    super(!!token, { maxConcurrent: 5, minTime: 200 });
    this.token = token ?? '';
  }

  protected async doSearch(params: CandidateSearchParams): Promise<CandidateProfile[]> {
    logger.info(`GitHub: searching for "${params.query}"`);

    const q = [params.query];
    if (params.location) q.push(`location:${params.location}`);

    const response = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(q.join(' '))}&per_page=${params.limit ?? 10}`,
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      logger.error(`GitHub search failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      items?: Array<{
        login: string;
        html_url: string;
        name?: string;
        bio?: string;
        location?: string;
      }>;
    };

    return (data.items ?? []).map((u) => ({
      name: u.name ?? u.login,
      headline: u.bio,
      location: u.location,
      skills: [],
      profileUrl: u.html_url,
      source: 'github',
    }));
  }

  protected async doEnrich(candidate: Partial<Candidate>): Promise<Partial<Candidate>> {
    if (!candidate.github_url) return candidate;
    logger.info(`GitHub: enriching ${candidate.github_url}`);

    const username = candidate.github_url.split('/').pop();
    if (!username) return candidate;

    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&per_page=50`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );

      if (reposRes.ok) {
        const repos = (await reposRes.json()) as Array<{ language?: string | null }>;
        const languages = [
          ...new Set(repos.map((r) => r.language).filter((l): l is string => !!l)),
        ];
        candidate.skills = [
          ...new Set([...(candidate.skills ?? []), ...languages]),
        ];
      }
    } catch (err) {
      logger.error('GitHub enrichment failed:', err);
    }

    return candidate;
  }

  protected async doHealthCheck(): Promise<boolean> {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.ok;
  }
}
