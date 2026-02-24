import { BaseProvider } from './base.js';
import type { CandidateSearchParams, CandidateProfile } from '../types/provider.js';
import type { Candidate } from '../types/database.js';
import { logger } from '../utils/logger.js';

export class GreenhouseProvider extends BaseProvider {
  readonly name = 'greenhouse';
  private apiKey: string;
  private baseUrl = 'https://harvest.greenhouse.io/v1';

  constructor(apiKey?: string) {
    super(!!apiKey, { maxConcurrent: 3, minTime: 300 });
    this.apiKey = apiKey ?? '';
  }

  protected async doSearch(params: CandidateSearchParams): Promise<CandidateProfile[]> {
    logger.info(`Greenhouse: searching for "${params.query}"`);

    const response = await fetch(
      `${this.baseUrl}/candidates?per_page=${params.limit ?? 10}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        },
      },
    );

    if (!response.ok) {
      logger.error(`Greenhouse search failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as Array<{
      first_name?: string;
      last_name?: string;
      emails?: Array<{ value: string }>;
      title?: string;
      tags?: string[];
      id?: number;
    }>;

    return data.map((c) => ({
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
      email: c.emails?.[0]?.value,
      headline: c.title,
      skills: c.tags ?? [],
      profileUrl: `${this.baseUrl}/candidates/${c.id ?? ''}`,
      source: 'greenhouse',
    }));
  }

  protected async doEnrich(candidate: Partial<Candidate>): Promise<Partial<Candidate>> {
    logger.info(`Greenhouse: enrichment not implemented for ${candidate.email ?? 'unknown'}`);
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
