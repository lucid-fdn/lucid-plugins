import { describe, it, expect } from 'vitest';
import {
  analyzeResume,
  extractSkills,
  estimateExperienceYears,
} from '../src/core/analysis/resume-analyzer.js';
import type { ExperienceEntry } from '../src/core/analysis/resume-analyzer.js';

const SAMPLE_RESUME = `
John Doe
john.doe@example.com
+1 (555) 123-4567

Summary
Experienced software engineer with 8 years of experience in full-stack development.
Passionate about building scalable applications using modern technologies.

Experience
Senior Engineer at Google
2020 - present
Led the development of microservices architecture using TypeScript and Node.js.

Software Engineer at Facebook
2016 - 2020
Built React-based dashboards for data analysis with Python and PostgreSQL.

Education
Bachelor of Science in Computer Science from Stanford University 2015
`;

describe('extractSkills', () => {
  it('extracts known skills from text', () => {
    const skills = extractSkills('Experience with TypeScript, React, and Node.js');
    expect(skills).toContain('typescript');
    expect(skills).toContain('react');
    expect(skills).toContain('node.js');
  });

  it('extracts skills case-insensitively', () => {
    const skills = extractSkills('Proficient in PYTHON and JAVA');
    expect(skills).toContain('python');
    expect(skills).toContain('java');
  });

  it('returns empty array for unknown skills only', () => {
    const skills = extractSkills('Expert in quantum computing and teleportation');
    expect(skills).toEqual([]);
  });

  it('deduplicates skills', () => {
    const skills = extractSkills('Python developer, loves Python, uses Python daily');
    const pythonCount = skills.filter((s) => s === 'python').length;
    expect(pythonCount).toBe(1);
  });

  it('extracts multiple categories of skills', () => {
    const skills = extractSkills(
      'AWS, Docker, Kubernetes, React, TypeScript, PostgreSQL, Git, CI/CD',
    );
    expect(skills.length).toBeGreaterThanOrEqual(6);
    expect(skills).toContain('aws');
    expect(skills).toContain('docker');
    expect(skills).toContain('kubernetes');
  });
});

describe('estimateExperienceYears', () => {
  it('calculates years from experience entries', () => {
    const entries: ExperienceEntry[] = [
      { title: 'Senior Engineer', company: 'Google', startYear: 2020, endYear: 2024, description: '' },
      { title: 'Engineer', company: 'Facebook', startYear: 2016, endYear: 2020, description: '' },
    ];
    expect(estimateExperienceYears(entries)).toBe(8);
  });

  it('returns 0 for empty experience', () => {
    expect(estimateExperienceYears([])).toBe(0);
  });

  it('uses entry count fallback when years are missing', () => {
    const entries: ExperienceEntry[] = [
      { title: 'Dev', company: 'A', description: '' },
      { title: 'Dev', company: 'B', description: '' },
      { title: 'Dev', company: 'C', description: '' },
    ];
    expect(estimateExperienceYears(entries)).toBe(6); // 3 entries * 2 years
  });

  it('caps at 40 years', () => {
    const entries: ExperienceEntry[] = [
      { title: 'Dev', company: 'A', startYear: 1970, endYear: 2024, description: '' },
    ];
    expect(estimateExperienceYears(entries)).toBeLessThanOrEqual(40);
  });
});

describe('analyzeResume', () => {
  it('extracts name from resume', () => {
    const result = analyzeResume(SAMPLE_RESUME);
    expect(result.name).toBe('John Doe');
  });

  it('extracts email from resume', () => {
    const result = analyzeResume(SAMPLE_RESUME);
    expect(result.email).toBe('john.doe@example.com');
  });

  it('extracts phone from resume', () => {
    const result = analyzeResume(SAMPLE_RESUME);
    expect(result.phone).not.toBeNull();
  });

  it('extracts skills from resume', () => {
    const result = analyzeResume(SAMPLE_RESUME);
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.skills).toContain('typescript');
    expect(result.skills).toContain('react');
  });

  it('returns a summary', () => {
    const result = analyzeResume(SAMPLE_RESUME);
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
