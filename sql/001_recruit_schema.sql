-- Lucid Recruit ATS Schema
-- Migration: 001_recruit_schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE IF NOT EXISTS recruit_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  job_type TEXT NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('intern', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive')),
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT NOT NULL DEFAULT 'USD',
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  skills_preferred TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paused', 'closed', 'filled')),
  hiring_manager TEXT,
  posted_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruit_jobs_tenant ON recruit_jobs(tenant_id);
CREATE INDEX idx_recruit_jobs_status ON recruit_jobs(status);

-- Candidates table
CREATE TABLE IF NOT EXISTS recruit_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  resume_url TEXT,
  current_title TEXT,
  current_company TEXT,
  experience_years NUMERIC,
  skills TEXT[] NOT NULL DEFAULT '{}',
  education JSONB NOT NULL DEFAULT '[]',
  location TEXT,
  source TEXT NOT NULL CHECK (source IN ('linkedin', 'github', 'referral', 'job_board', 'careers_page', 'agency', 'manual')),
  source_detail TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_recruit_candidates_tenant ON recruit_candidates(tenant_id);
CREATE INDEX idx_recruit_candidates_email ON recruit_candidates(email);
CREATE INDEX idx_recruit_candidates_skills ON recruit_candidates USING GIN(skills);

-- Applications table
CREATE TABLE IF NOT EXISTS recruit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES recruit_jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES recruit_candidates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'screening', 'phone_screen', 'interview', 'technical', 'offer', 'hired', 'rejected', 'withdrawn')),
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  match_score NUMERIC CHECK (match_score >= 0 AND match_score <= 100),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_recruit_applications_tenant ON recruit_applications(tenant_id);
CREATE INDEX idx_recruit_applications_job ON recruit_applications(job_id);
CREATE INDEX idx_recruit_applications_candidate ON recruit_applications(candidate_id);
CREATE INDEX idx_recruit_applications_stage ON recruit_applications(stage);

-- Evaluations table
CREATE TABLE IF NOT EXISTS recruit_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  application_id UUID NOT NULL REFERENCES recruit_applications(id) ON DELETE CASCADE,
  evaluator_name TEXT NOT NULL,
  stage TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('strong_no', 'no', 'neutral', 'yes', 'strong_yes')),
  strengths TEXT[] NOT NULL DEFAULT '{}',
  concerns TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recruit_evaluations_application ON recruit_evaluations(application_id);

-- Interviews table
CREATE TABLE IF NOT EXISTS recruit_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  application_id UUID NOT NULL REFERENCES recruit_applications(id) ON DELETE CASCADE,
  interviewer_name TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('phone', 'video', 'onsite', 'technical')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_link TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

CREATE INDEX idx_recruit_interviews_application ON recruit_interviews(application_id);
CREATE INDEX idx_recruit_interviews_scheduled ON recruit_interviews(scheduled_at);

-- Row Level Security policies
ALTER TABLE recruit_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruit_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruit_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruit_interviews ENABLE ROW LEVEL SECURITY;

-- Policies for tenant isolation
CREATE POLICY recruit_jobs_tenant_policy ON recruit_jobs
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY recruit_candidates_tenant_policy ON recruit_candidates
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY recruit_applications_tenant_policy ON recruit_applications
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY recruit_evaluations_tenant_policy ON recruit_evaluations
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY recruit_interviews_tenant_policy ON recruit_interviews
  USING (tenant_id = current_setting('app.tenant_id', true));
