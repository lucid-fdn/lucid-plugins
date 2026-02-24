import { extractEmails, extractPhones } from '../utils/text.js';

export interface ExperienceEntry {
  title: string;
  company: string;
  startYear?: number;
  endYear?: number;
  description: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  year?: number;
}

export interface ParsedResume {
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  summary: string;
}

// Common technical skills for extraction
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby',
  'php', 'swift', 'kotlin', 'scala', 'r', 'sql', 'nosql', 'html', 'css',
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'node.js', 'express',
  'django', 'flask', 'spring', 'rails', 'laravel', '.net',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
  'git', 'ci/cd', 'jenkins', 'github actions', 'gitlab',
  'machine learning', 'deep learning', 'nlp', 'computer vision',
  'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
  'agile', 'scrum', 'kanban', 'jira', 'confluence',
  'figma', 'sketch', 'adobe xd', 'photoshop',
  'rest', 'graphql', 'grpc', 'microservices', 'api design',
  'linux', 'unix', 'windows server',
  'data analysis', 'data engineering', 'etl', 'data warehousing',
  'security', 'penetration testing', 'oauth', 'jwt',
  'blockchain', 'solidity', 'web3',
  'product management', 'project management', 'leadership', 'communication',
];

/**
 * Extract skills from resume text.
 */
export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    // Word boundary check using regex
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(lower)) {
      found.push(skill);
    }
  }

  return [...new Set(found)];
}

/**
 * Estimate total years of experience from parsed experience entries.
 */
export function estimateExperienceYears(experience: ExperienceEntry[]): number {
  if (experience.length === 0) return 0;

  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  for (const entry of experience) {
    const start = entry.startYear ?? currentYear;
    const end = entry.endYear ?? currentYear;
    totalYears += Math.max(0, end - start);
  }

  // Cap at reasonable maximum, and use entry count as fallback
  if (totalYears === 0) {
    totalYears = experience.length * 2; // Rough estimate: 2 years per position
  }

  return Math.min(totalYears, 40);
}

/**
 * Parse resume text into structured data.
 */
export function analyzeResume(text: string): ParsedResume {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract contact info
  const emails = extractEmails(text);
  const phones = extractPhones(text);

  // First line is often the name
  const name = lines[0] ?? 'Unknown';

  // Extract skills
  const skills = extractSkills(text);

  // Parse experience sections
  const experience = parseExperience(text);

  // Parse education sections
  const education = parseEducation(text);

  // Build summary from first paragraph after name/contact
  const summaryLines: string[] = [];
  let inSummary = false;
  for (const line of lines.slice(1)) {
    if (/^(summary|objective|about|profile)/i.test(line)) {
      inSummary = true;
      continue;
    }
    if (/^(experience|education|skills|work history|employment|projects)\s*$/i.test(line)) {
      break;
    }
    if (inSummary || (summaryLines.length === 0 && !emails.includes(line) && !phones.includes(line))) {
      if (line.length > 20) {
        summaryLines.push(line);
      }
    }
    if (summaryLines.length >= 3) break;
  }

  return {
    name,
    email: emails[0] ?? null,
    phone: phones[0] ?? null,
    skills,
    experience,
    education,
    summary: summaryLines.join(' '),
  };
}

function parseExperience(text: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const lines = text.split('\n');

  // Simple pattern: "Title at Company" or "Title - Company"
  const jobPattern = /^(.+?)(?:\s+at\s+|\s+-\s+|\s+@\s+)(.+?)$/i;
  const yearPattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/i;

  let currentEntry: Partial<ExperienceEntry> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const jobMatch = trimmed.match(jobPattern);
    const yearMatch = trimmed.match(yearPattern);

    if (jobMatch) {
      if (currentEntry?.title) {
        entries.push({
          title: currentEntry.title,
          company: currentEntry.company ?? '',
          startYear: currentEntry.startYear,
          endYear: currentEntry.endYear,
          description: currentEntry.description ?? '',
        });
      }
      currentEntry = {
        title: jobMatch[1]?.trim() ?? '',
        company: jobMatch[2]?.trim() ?? '',
        description: '',
      };
    } else if (yearMatch && currentEntry) {
      currentEntry.startYear = parseInt(yearMatch[1] ?? '0', 10);
      const endStr = yearMatch[2]?.toLowerCase() ?? '';
      currentEntry.endYear =
        endStr === 'present' || endStr === 'current'
          ? new Date().getFullYear()
          : parseInt(endStr, 10);
    }
  }

  if (currentEntry?.title) {
    entries.push({
      title: currentEntry.title,
      company: currentEntry.company ?? '',
      startYear: currentEntry.startYear,
      endYear: currentEntry.endYear,
      description: currentEntry.description ?? '',
    });
  }

  return entries;
}

function parseEducation(text: string): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const lines = text.split('\n');

  const degreePattern =
    /\b(bachelor|master|phd|doctorate|mba|associate|bs|ba|ms|ma|b\.s\.|b\.a\.|m\.s\.|m\.a\.)\b/i;
  const yearPattern = /\b(19|20)\d{2}\b/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (degreePattern.test(trimmed)) {
      const yearMatch = trimmed.match(yearPattern);
      entries.push({
        institution: trimmed.replace(degreePattern, '').replace(yearPattern, '').trim().split(',')[0]?.trim() ?? '',
        degree: trimmed.match(degreePattern)?.[0] ?? '',
        field: '',
        year: yearMatch ? parseInt(yearMatch[0], 10) : undefined,
      });
    }
  }

  return entries;
}
