export const JOB_STATUSES = ['draft', 'open', 'paused', 'closed', 'filled'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const CANDIDATE_STAGES = [
  'applied',
  'screening',
  'phone_screen',
  'interview',
  'technical',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
] as const;
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const EXPERIENCE_LEVELS = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'principal',
  'executive',
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EVALUATION_RATINGS = ['strong_no', 'no', 'neutral', 'yes', 'strong_yes'] as const;
export type EvaluationRating = (typeof EVALUATION_RATINGS)[number];

export const SOURCE_TYPES = [
  'linkedin',
  'github',
  'referral',
  'job_board',
  'careers_page',
  'agency',
  'manual',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const INTERVIEW_TYPES = ['phone', 'video', 'onsite', 'technical'] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
