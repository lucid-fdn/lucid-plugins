import type {
  JobStatus,
  JobType,
  ExperienceLevel,
  CandidateStage,
  EvaluationRating,
  SourceType,
  InterviewType,
  InterviewStatus,
} from './common.js';

export interface Job {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  skills_required: string[];
  skills_preferred: string[];
  status: JobStatus;
  hiring_manager: string | null;
  posted_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year?: number;
}

export interface Candidate {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  current_title: string | null;
  current_company: string | null;
  experience_years: number | null;
  skills: string[];
  education: Education[];
  location: string | null;
  source: SourceType;
  source_detail: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  tenant_id: string;
  job_id: string;
  candidate_id: string;
  stage: CandidateStage;
  score: number | null;
  match_score: number | null;
  applied_at: string;
  stage_changed_at: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  tenant_id: string;
  application_id: string;
  evaluator_name: string;
  stage: CandidateStage;
  rating: EvaluationRating;
  strengths: string[];
  concerns: string[];
  notes: string | null;
  created_at: string;
}

export interface InterviewSchedule {
  id: string;
  tenant_id: string;
  application_id: string;
  interviewer_name: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  notes: string | null;
  status: InterviewStatus;
}
