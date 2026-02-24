import { describe, it, expect } from 'vitest';
import {
  scoreCandidate,
  matchSkills,
  assessExperience,
} from '../src/core/analysis/candidate-scorer.js';
import type { Candidate, Job } from '../src/core/types/database.js';

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'cand-1',
    tenant_id: 'test',
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Smith',
    phone: '+1234567890',
    linkedin_url: 'https://linkedin.com/in/alice',
    github_url: 'https://github.com/alice',
    resume_url: null,
    current_title: 'Software Engineer',
    current_company: 'Acme',
    experience_years: 5,
    skills: ['typescript', 'react', 'node.js', 'postgresql'],
    education: [{ institution: 'MIT', degree: 'Bachelor', field: 'CS', year: 2018 }],
    location: 'San Francisco',
    source: 'linkedin',
    source_detail: null,
    tags: ['frontend', 'fullstack'],
    notes: 'Strong candidate',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    tenant_id: 'test',
    title: 'Senior Frontend Engineer',
    description: 'Build amazing UIs',
    department: 'Engineering',
    location: 'San Francisco',
    job_type: 'full_time',
    experience_level: 'senior',
    salary_min: 150000,
    salary_max: 200000,
    currency: 'USD',
    skills_required: ['typescript', 'react'],
    skills_preferred: ['node.js', 'graphql'],
    status: 'open',
    hiring_manager: 'Bob',
    posted_at: new Date().toISOString(),
    closes_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('matchSkills', () => {
  it('returns full score when all skills match', () => {
    const score = matchSkills(['typescript', 'react', 'node.js'], ['typescript', 'react'], ['node.js']);
    expect(score).toBe(35);
  });

  it('returns partial score for partial matches', () => {
    const score = matchSkills(['typescript'], ['typescript', 'react'], ['node.js']);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(35);
  });

  it('returns 0 when no skills match', () => {
    const score = matchSkills(['python', 'django'], ['typescript', 'react'], ['node.js']);
    expect(score).toBe(0);
  });

  it('returns full score when no skills required', () => {
    const score = matchSkills(['typescript'], [], []);
    expect(score).toBe(35);
  });

  it('matches skills case-insensitively', () => {
    const score = matchSkills(['TypeScript', 'React'], ['typescript', 'react'], []);
    // 25 from required (100% match) + 10 from preferred (empty = full credit) = 35
    expect(score).toBe(35);
  });
});

describe('assessExperience', () => {
  it('returns max score for perfect experience fit', () => {
    expect(assessExperience(7, 'senior')).toBe(25);
  });

  it('returns lower score for under-experienced', () => {
    const score = assessExperience(1, 'senior');
    expect(score).toBeLessThan(25);
  });

  it('returns neutral score when years are unknown', () => {
    expect(assessExperience(null, 'senior')).toBe(12);
  });

  it('penalizes over-qualification mildly', () => {
    const score = assessExperience(20, 'junior');
    expect(score).toBeLessThan(25);
    expect(score).toBeGreaterThanOrEqual(10);
  });
});

describe('scoreCandidate', () => {
  it('returns total and breakdown', () => {
    const result = scoreCandidate(makeCandidate(), makeJob());
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.skills_match).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.skills_match).toBeLessThanOrEqual(35);
    expect(result.breakdown.experience_fit).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.experience_fit).toBeLessThanOrEqual(25);
  });

  it('scores highly for a strong match', () => {
    const candidate = makeCandidate({
      skills: ['typescript', 'react', 'node.js', 'graphql'],
      experience_years: 7,
    });
    const result = scoreCandidate(candidate, makeJob());
    expect(result.total).toBeGreaterThan(70);
  });

  it('scores lower for a weak match', () => {
    const candidate = makeCandidate({
      skills: ['python', 'django'],
      experience_years: 1,
      linkedin_url: null,
      github_url: null,
      tags: [],
      phone: null,
      notes: null,
    });
    const result = scoreCandidate(candidate, makeJob());
    expect(result.total).toBeLessThan(50);
  });
});
