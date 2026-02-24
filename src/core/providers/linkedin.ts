import { BaseProvider } from './base.js';
import type { CandidateSearchParams, CandidateProfile } from '../types/provider.js';
import type { Candidate } from '../types/database.js';
import { logger } from '../utils/logger.js';

export class LinkedInProvider extends BaseProvider {
  readonly name = 'linkedin';
  private apiKey: string;

  constructor(apiKey?: string) {
    super(!!apiKey, { maxConcurrent: 1, minTime: 1000 });
    this.apiKey = apiKey ?? '';
  }

  protected async doSearch(params: CandidateSearchParams): Promise<CandidateProfile[]> {
    logger.info(`LinkedIn: searching for "${params.query}"`);

    // LinkedIn API integration placeholder
    const response = await fetch('https://api.linkedin.com/v2/people-search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: params.query,
        skills: params.skills,
        location: params.location,
        count: params.limit ?? 10,
      }),
    });

    if (!response.ok) {
      logger.error(`LinkedIn search failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      elements?: Array<{
        firstName?: string;
        lastName?: string;
        headline?: string;
        location?: { name?: string };
        skills?: Array<{ name: string }>;
        profileUrl?: string;
      }>;
    };

    return (data.elements ?? []).map((p) => ({
      name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
      headline: p.headline,
      location: p.location?.name,
      skills: (p.skills ?? []).map((s) => s.name),
      profileUrl: p.profileUrl ?? '',
      source: 'linkedin',
    }));
  }

  protected async doEnrich(candidate: Partial<Candidate>): Promise<Partial<Candidate>> {
    if (!candidate.linkedin_url) return candidate;
    logger.info(`LinkedIn: enriching ${candidate.linkedin_url}`);
    // Enrichment placeholder - would pull profile details
    return candidate;
  }

  protected async doHealthCheck(): Promise<boolean> {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.ok;
  }
}
