import type { Job, Candidate } from '../types/database.js';

export const CANDIDATE_SCREEN_PROMPT = `You are an expert recruiter screening candidates for a position. Analyze the candidate's profile against the job requirements and provide:

1. A match score from 0-100
2. Key strengths relevant to the role
3. Potential concerns or gaps
4. A recommendation (strong_yes, yes, neutral, no, strong_no)

Be objective and focus on skills, experience, and qualifications.`;

export const JOB_DESCRIPTION_PROMPT = `You are an expert at writing compelling job descriptions. Create a detailed, inclusive job posting that:

1. Clearly describes the role and responsibilities
2. Lists required and preferred qualifications
3. Highlights company culture and benefits
4. Uses inclusive language
5. Is optimized for job board search visibility`;

export function buildScreeningPrompt(candidate: Candidate, job: Job): string {
  return `${CANDIDATE_SCREEN_PROMPT}

## Job Details
- Title: ${job.title}
- Department: ${job.department}
- Level: ${job.experience_level}
- Type: ${job.job_type}
- Location: ${job.location}
- Required Skills: ${job.skills_required.join(', ')}
- Preferred Skills: ${job.skills_preferred.join(', ')}

## Candidate Profile
- Name: ${candidate.first_name} ${candidate.last_name}
- Current Role: ${candidate.current_title ?? 'Not specified'} at ${candidate.current_company ?? 'Not specified'}
- Experience: ${candidate.experience_years ?? 'Unknown'} years
- Skills: ${candidate.skills.join(', ')}
- Education: ${candidate.education.map((e) => `${e.degree} in ${e.field} from ${e.institution}`).join('; ') || 'Not specified'}
- Location: ${candidate.location ?? 'Not specified'}
- Source: ${candidate.source}

Please provide your screening assessment.`;
}
