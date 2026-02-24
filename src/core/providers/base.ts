import Bottleneck from 'bottleneck';
import type { RecruitProvider, CandidateSearchParams, CandidateProfile } from '../types/provider.js';
import type { Candidate } from '../types/database.js';
import { logger } from '../utils/logger.js';

export abstract class BaseProvider implements RecruitProvider {
  abstract readonly name: string;
  protected limiter: Bottleneck;
  private _enabled: boolean;

  constructor(
    enabled: boolean,
    rateLimitOptions?: Bottleneck.ConstructorOptions,
  ) {
    this._enabled = enabled;
    this.limiter = new Bottleneck({
      maxConcurrent: 2,
      minTime: 500,
      ...rateLimitOptions,
    });
  }

  get enabled(): boolean {
    return this._enabled;
  }

  async searchCandidates(params: CandidateSearchParams): Promise<CandidateProfile[]> {
    if (!this._enabled) {
      logger.warn(`Provider ${this.name} is not enabled`);
      return [];
    }
    return this.limiter.schedule(() => this.doSearch(params));
  }

  async enrichCandidate(candidate: Partial<Candidate>): Promise<Partial<Candidate>> {
    if (!this._enabled) return candidate;
    return this.limiter.schedule(() => this.doEnrich(candidate));
  }

  async healthCheck(): Promise<boolean> {
    if (!this._enabled) return false;
    try {
      return await this.doHealthCheck();
    } catch (err) {
      logger.error(`Health check failed for ${this.name}:`, err);
      return false;
    }
  }

  protected abstract doSearch(params: CandidateSearchParams): Promise<CandidateProfile[]>;
  protected abstract doEnrich(candidate: Partial<Candidate>): Promise<Partial<Candidate>>;
  protected abstract doHealthCheck(): Promise<boolean>;
}
