import { BaseProvider } from './base.js';
import type { CandidateSearchParams, CandidateProfile } from '../types/provider.js';
import type { Candidate } from '../types/database.js';
import { logger } from '../utils/logger.js';

export class LeverProvider extends BaseProvider {
  readonly name = 'lever';
  private apiKey: string;
  private baseUrl = 'https://api.lever.co/v1';

  constructor(apiKey?: string) {
    super(!!apiKey, { maxConcurrent: 3, minTime: 300 });
    this.apiKey = apiKey ?? '';
  }

  protected async doSearch(params: CandidateSearchParams): Promise<CandidateProfile[]> {
    logger.info(`Lever: searching for "${params.query}"`);

    const response = await fetch(
      `${this.baseUrl}/candidates?limit=${params.limit ?? 10}&email=${encodeURIComponent(params.query)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        },
      },
    );

    if (!response.ok) {
      logger.error(`Lever search failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      data?: Array<{
        name?: string;
        emails?: string[];
        headline?: string;
        location?: string;
        tags?: string[];
        id?: string;
      }>;
    };

    return (data.data ?? []).map((c) => ({
      name: c.name ?? '',
      email: c.emails?.[0],
      headline: c.headline,
      location: c.location,
      skills: c.tags ?? [],
      profileUrl: `${this.baseUrl}/candidates/${c.id ?? ''}`,
      source: 'lever',
    }));
  }

  protected async doEnrich(candidate: Partial<Candidate>): Promise<Partial<Candidate>> {
    logger.info(`Lever: enrichment not implemented for ${candidate.email ?? 'unknown'}`);
    return candidate;
  }

  protected async doHealthCheck(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/users`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      },
    });
    return response.ok;
  }
}
