import type { Candidate } from './database.js';

export interface CandidateSearchParams {
  query: string;
  skills?: string[];
  location?: string;
  experienceLevel?: string;
  limit?: number;
}

export interface CandidateProfile {
  name: string;
  email?: string;
  headline?: string;
  location?: string;
  skills: string[];
  experienceYears?: number;
  profileUrl: string;
  source: string;
}

export interface RecruitProvider {
  readonly name: string;
  readonly enabled: boolean;
  searchCandidates(params: CandidateSearchParams): Promise<CandidateProfile[]>;
  enrichCandidate(candidate: Partial<Candidate>): Promise<Partial<Candidate>>;
  healthCheck(): Promise<boolean>;
}
