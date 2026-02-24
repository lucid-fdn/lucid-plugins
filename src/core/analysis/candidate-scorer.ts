import type { Candidate, Job } from '../types/database.js';
import type { ExperienceLevel } from '../types/common.js';
import { skillsMatch } from '../utils/text.js';

export interface ScoreBreakdown {
  skills_match: number;    // 0-35
  experience_fit: number;  // 0-25
  education_fit: number;   // 0-15
  culture_signals: number; // 0-15
  recency: number;         // 0-10
}

export interface CandidateScore {
  total: number;
  breakdown: ScoreBreakdown;
}

const LEVEL_YEARS: Record<ExperienceLevel, [number, number]> = {
  intern: [0, 1],
  junior: [0, 2],
  mid: [2, 5],
  senior: [5, 10],
  lead: [7, 15],
  principal: [10, 20],
  executive: [12, 30],
};

/**
 * Count how many of the required/preferred skills the candidate has.
 */
export function matchSkills(
  candidateSkills: string[],
  required: string[],
  preferred: string[],
): number {
  if (required.length === 0 && preferred.length === 0) return 35;

  let requiredMatches = 0;
  let preferredMatches = 0;

  for (const req of required) {
    if (candidateSkills.some((cs) => skillsMatch(cs, req))) {
      requiredMatches++;
    }
  }

  for (const pref of preferred) {
    if (candidateSkills.some((cs) => skillsMatch(cs, pref))) {
      preferredMatches++;
    }
  }

  const requiredScore =
    required.length > 0 ? (requiredMatches / required.length) * 25 : 25;
  const preferredScore =
    preferred.length > 0 ? (preferredMatches / preferred.length) * 10 : 10;

  return Math.round(requiredScore + preferredScore);
}

/**
 * Assess experience fit based on candidate years vs. job level.
 */
export function assessExperience(years: number | null, level: ExperienceLevel): number {
  if (years === null) return 12; // neutral if unknown
  const [min, max] = LEVEL_YEARS[level];

  if (years >= min && years <= max) return 25;
  if (years < min) {
    const gap = min - years;
    return Math.max(0, 25 - gap * 5);
  }
  // Over-qualified: mild penalty
  const excess = years - max;
  return Math.max(10, 25 - excess * 2);
}

/**
 * Score education fit. Basic heuristic.
 */
function scoreEducation(candidate: Candidate, _job: Job): number {
  if (!candidate.education || candidate.education.length === 0) return 7;

  const degrees = candidate.education.map((e) => e.degree?.toLowerCase() ?? '');
  const hasAdvanced = degrees.some(
    (d) => d.includes('master') || d.includes('phd') || d.includes('doctorate') || d.includes('mba'),
  );
  const hasBachelor = degrees.some((d) => d.includes('bachelor') || d.includes('bs') || d.includes('ba'));

  if (hasAdvanced) return 15;
  if (hasBachelor) return 12;
  return 8;
}

/**
 * Culture signals: tags, source quality, profile completeness.
 */
function scoreCultureSignals(candidate: Candidate): number {
  let score = 5; // baseline

  if (candidate.linkedin_url) score += 2;
  if (candidate.github_url) score += 2;
  if (candidate.tags.length > 0) score += 2;
  if (candidate.notes) score += 1;
  if (candidate.phone) score += 1;

  return Math.min(15, score);
}

/**
 * Recency: how recently was the candidate profile updated?
 */
function scoreRecency(candidate: Candidate): number {
  const updatedAt = new Date(candidate.updated_at).getTime();
  const now = Date.now();
  const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 7) return 10;
  if (daysSinceUpdate < 30) return 8;
  if (daysSinceUpdate < 90) return 6;
  if (daysSinceUpdate < 180) return 4;
  return 2;
}

/**
 * Full candidate scoring against a job.
 */
export function scoreCandidate(candidate: Candidate, job: Job): CandidateScore {
  const breakdown: ScoreBreakdown = {
    skills_match: matchSkills(candidate.skills, job.skills_required, job.skills_preferred),
    experience_fit: assessExperience(candidate.experience_years, job.experience_level),
    education_fit: scoreEducation(candidate, job),
    culture_signals: scoreCultureSignals(candidate),
    recency: scoreRecency(candidate),
  };

  const total =
    breakdown.skills_match +
    breakdown.experience_fit +
    breakdown.education_fit +
    breakdown.culture_signals +
    breakdown.recency;

  return { total, breakdown };
}
