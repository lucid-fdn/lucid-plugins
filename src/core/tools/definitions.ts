import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { CandidateStage, EvaluationRating, InterviewType } from '../types/common.js';
import {
  CANDIDATE_STAGES,
  EVALUATION_RATINGS,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  SOURCE_TYPES,
  INTERVIEW_TYPES,
} from '../types/common.js';
import { getSupabaseClient } from '../db/client.js';
import * as dbJobs from '../db/jobs.js';
import * as dbCandidates from '../db/candidates.js';
import * as dbApplications from '../db/applications.js';
import * as dbEvaluations from '../db/evaluations.js';
import * as dbInterviews from '../db/interviews.js';
import { scoreCandidate } from '../analysis/candidate-scorer.js';
import { analyzePipeline, predictTimeToHire, identifyDropoffPoints } from '../analysis/pipeline-analyzer.js';
import { buildScreeningPrompt } from '../analysis/prompts.js';
import { logger } from '../utils/logger.js';
import { nowISO } from '../utils/date.js';

export function createToolDefinitions(config: PluginConfig): ToolDefinition[] {
  const client = getSupabaseClient(config.supabaseUrl, config.supabaseKey);
  const tenantId = config.tenantId;

  return [
    // 1. recruit_create_job
    {
      name: 'recruit_create_job',
      description:
        'Create a new job posting with title, description, requirements, and compensation details.',
      params: {
        title: { type: 'string', description: 'Job title', required: true },
        description: { type: 'string', description: 'Job description', required: true },
        department: { type: 'string', description: 'Department name', required: true },
        location: { type: 'string', description: 'Job location', required: true },
        job_type: {
          type: 'string',
          description: 'Employment type',
          required: true,
          enum: JOB_TYPES,
        },
        experience_level: {
          type: 'string',
          description: 'Required experience level',
          required: true,
          enum: EXPERIENCE_LEVELS,
        },
        skills_required: {
          type: 'array',
          description: 'Required skills',
          required: true,
          items: { type: 'string' },
        },
        skills_preferred: {
          type: 'array',
          description: 'Preferred skills',
          items: { type: 'string' },
        },
        salary_min: { type: 'number', description: 'Minimum salary' },
        salary_max: { type: 'number', description: 'Maximum salary' },
        currency: { type: 'string', description: 'Salary currency (default USD)', default: 'USD' },
        hiring_manager: { type: 'string', description: 'Hiring manager name' },
      },
      execute: async (args) => {
        logger.info(`Creating job: ${args['title'] as string}`);
        const job = await dbJobs.createJob(client, {
          tenant_id: tenantId,
          title: args['title'] as string,
          description: args['description'] as string,
          department: args['department'] as string,
          location: args['location'] as string,
          job_type: args['job_type'] as typeof JOB_TYPES[number],
          experience_level: args['experience_level'] as typeof EXPERIENCE_LEVELS[number],
          skills_required: (args['skills_required'] as string[]) ?? [],
          skills_preferred: (args['skills_preferred'] as string[]) ?? [],
          salary_min: (args['salary_min'] as number) ?? null,
          salary_max: (args['salary_max'] as number) ?? null,
          currency: (args['currency'] as string) ?? 'USD',
          status: 'draft',
          hiring_manager: (args['hiring_manager'] as string) ?? null,
          posted_at: null,
          closes_at: null,
        });
        return { success: true, job };
      },
    },

    // 2. recruit_search_candidates
    {
      name: 'recruit_search_candidates',
      description:
        'Search candidates by query, skills, experience level, and location.',
      params: {
        query: { type: 'string', description: 'Search query (name, email, title)', required: true },
        skills: {
          type: 'array',
          description: 'Filter by skills',
          items: { type: 'string' },
        },
        experience_level: {
          type: 'string',
          description: 'Filter by experience level',
          enum: EXPERIENCE_LEVELS,
        },
        location: { type: 'string', description: 'Filter by location' },
        limit: { type: 'number', description: 'Max results (default 25)', default: 25 },
      },
      execute: async (args) => {
        const candidates = await dbCandidates.searchCandidates(client, tenantId, {
          query: args['query'] as string,
          skills: args['skills'] as string[] | undefined,
          location: args['location'] as string | undefined,
          limit: args['limit'] as number | undefined,
        });
        return { success: true, count: candidates.length, candidates };
      },
    },

    // 3. recruit_add_candidate
    {
      name: 'recruit_add_candidate',
      description: 'Add a new candidate to the system.',
      params: {
        email: { type: 'string', description: 'Candidate email', required: true },
        first_name: { type: 'string', description: 'First name', required: true },
        last_name: { type: 'string', description: 'Last name', required: true },
        phone: { type: 'string', description: 'Phone number' },
        linkedin_url: { type: 'string', description: 'LinkedIn profile URL' },
        github_url: { type: 'string', description: 'GitHub profile URL' },
        current_title: { type: 'string', description: 'Current job title' },
        current_company: { type: 'string', description: 'Current company' },
        experience_years: { type: 'number', description: 'Years of experience' },
        skills: {
          type: 'array',
          description: 'Skills list',
          required: true,
          items: { type: 'string' },
        },
        location: { type: 'string', description: 'Location' },
        source: {
          type: 'string',
          description: 'How the candidate was sourced',
          required: true,
          enum: SOURCE_TYPES,
        },
        source_detail: { type: 'string', description: 'Additional source details' },
        tags: { type: 'array', description: 'Tags', items: { type: 'string' } },
        notes: { type: 'string', description: 'Notes' },
      },
      execute: async (args) => {
        logger.info(`Adding candidate: ${args['email'] as string}`);

        // Check for duplicate
        const existing = await dbCandidates.findCandidateByEmail(
          client,
          tenantId,
          args['email'] as string,
        );
        if (existing) {
          return { success: false, error: 'Candidate with this email already exists', candidate: existing };
        }

        const candidate = await dbCandidates.createCandidate(client, {
          tenant_id: tenantId,
          email: args['email'] as string,
          first_name: args['first_name'] as string,
          last_name: args['last_name'] as string,
          phone: (args['phone'] as string) ?? null,
          linkedin_url: (args['linkedin_url'] as string) ?? null,
          github_url: (args['github_url'] as string) ?? null,
          resume_url: null,
          current_title: (args['current_title'] as string) ?? null,
          current_company: (args['current_company'] as string) ?? null,
          experience_years: (args['experience_years'] as number) ?? null,
          skills: (args['skills'] as string[]) ?? [],
          education: [],
          location: (args['location'] as string) ?? null,
          source: args['source'] as typeof SOURCE_TYPES[number],
          source_detail: (args['source_detail'] as string) ?? null,
          tags: (args['tags'] as string[]) ?? [],
          notes: (args['notes'] as string) ?? null,
        });
        return { success: true, candidate };
      },
    },

    // 4. recruit_screen_candidate
    {
      name: 'recruit_screen_candidate',
      description:
        'AI screen a candidate against a job posting, producing a score and breakdown.',
      params: {
        candidate_id: { type: 'string', description: 'Candidate ID', required: true },
        job_id: { type: 'string', description: 'Job ID', required: true },
      },
      execute: async (args) => {
        const candidate = await dbCandidates.getCandidate(client, args['candidate_id'] as string);
        const job = await dbJobs.getJob(client, args['job_id'] as string);

        const score = scoreCandidate(candidate, job);
        const prompt = buildScreeningPrompt(candidate, job);

        // Check if application exists; create if not
        const apps = await dbApplications.listApplications(client, tenantId, {
          jobId: job.id,
          candidateId: candidate.id,
        });

        let application = apps[0];
        if (!application) {
          application = await dbApplications.createApplication(client, {
            tenant_id: tenantId,
            job_id: job.id,
            candidate_id: candidate.id,
            stage: 'screening',
            score: score.total,
            match_score: score.breakdown.skills_match,
            applied_at: nowISO(),
            stage_changed_at: nowISO(),
            rejection_reason: null,
          });
        } else {
          application = await dbApplications.updateApplicationScore(
            client,
            application.id,
            score.total,
            score.breakdown.skills_match,
          );
        }

        return {
          success: true,
          score: score.total,
          breakdown: score.breakdown,
          screening_prompt: prompt,
          application_id: application.id,
        };
      },
    },

    // 5. recruit_move_stage
    {
      name: 'recruit_move_stage',
      description: 'Move a candidate application to a new pipeline stage.',
      params: {
        application_id: { type: 'string', description: 'Application ID', required: true },
        stage: {
          type: 'string',
          description: 'New stage',
          required: true,
          enum: CANDIDATE_STAGES,
        },
        notes: { type: 'string', description: 'Notes about the stage change' },
        rejection_reason: { type: 'string', description: 'Reason for rejection (if rejecting)' },
      },
      execute: async (args) => {
        const stage = args['stage'] as CandidateStage;
        const rejectionReason = args['rejection_reason'] as string | undefined;

        const application = await dbApplications.updateApplicationStage(
          client,
          args['application_id'] as string,
          stage,
          rejectionReason,
        );

        logger.info(`Application ${application.id} moved to ${stage}`);
        return { success: true, application };
      },
    },

    // 6. recruit_add_evaluation
    {
      name: 'recruit_add_evaluation',
      description: 'Record an evaluation/feedback for a candidate application.',
      params: {
        application_id: { type: 'string', description: 'Application ID', required: true },
        evaluator: { type: 'string', description: 'Evaluator name', required: true },
        rating: {
          type: 'string',
          description: 'Overall rating',
          required: true,
          enum: EVALUATION_RATINGS,
        },
        strengths: {
          type: 'array',
          description: 'Candidate strengths',
          required: true,
          items: { type: 'string' },
        },
        concerns: {
          type: 'array',
          description: 'Concerns or gaps',
          items: { type: 'string' },
        },
        notes: { type: 'string', description: 'Additional notes' },
      },
      execute: async (args) => {
        // Verify application exists
        const application = await dbApplications.getApplication(
          client,
          args['application_id'] as string,
        );

        const evaluation = await dbEvaluations.createEvaluation(client, {
          tenant_id: tenantId,
          application_id: application.id,
          evaluator_name: args['evaluator'] as string,
          stage: application.stage,
          rating: args['rating'] as EvaluationRating,
          strengths: (args['strengths'] as string[]) ?? [],
          concerns: (args['concerns'] as string[]) ?? [],
          notes: (args['notes'] as string) ?? null,
        });

        return { success: true, evaluation };
      },
    },

    // 7. recruit_schedule_interview
    {
      name: 'recruit_schedule_interview',
      description: 'Schedule an interview for a candidate application.',
      params: {
        application_id: { type: 'string', description: 'Application ID', required: true },
        interviewer: { type: 'string', description: 'Interviewer name', required: true },
        type: {
          type: 'string',
          description: 'Interview type',
          required: true,
          enum: INTERVIEW_TYPES,
        },
        datetime: { type: 'string', description: 'Interview date/time (ISO 8601)', required: true },
        duration: { type: 'number', description: 'Duration in minutes (default 60)', default: 60 },
        meeting_link: { type: 'string', description: 'Meeting URL' },
        notes: { type: 'string', description: 'Interview notes' },
      },
      execute: async (args) => {
        const application = await dbApplications.getApplication(
          client,
          args['application_id'] as string,
        );

        const interview = await dbInterviews.createInterview(client, {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          application_id: application.id,
          interviewer_name: args['interviewer'] as string,
          interview_type: args['type'] as InterviewType,
          scheduled_at: args['datetime'] as string,
          duration_minutes: (args['duration'] as number) ?? 60,
          meeting_link: (args['meeting_link'] as string) ?? null,
          notes: (args['notes'] as string) ?? null,
          status: 'scheduled',
        });

        return { success: true, interview };
      },
    },

    // 8. recruit_get_pipeline
    {
      name: 'recruit_get_pipeline',
      description:
        'Get pipeline overview with stage counts, conversion rates, and bottleneck analysis.',
      params: {
        job_id: { type: 'string', description: 'Filter by job ID (optional)' },
      },
      execute: async (args) => {
        const applications = await dbApplications.listApplications(client, tenantId, {
          jobId: args['job_id'] as string | undefined,
        });

        const metrics = analyzePipeline(applications);
        const timeToHire = predictTimeToHire(applications);
        const dropoffs = identifyDropoffPoints(applications);

        return {
          success: true,
          metrics,
          predicted_time_to_hire_days: timeToHire,
          dropoff_points: dropoffs,
        };
      },
    },

    // 9. recruit_get_candidate_profile
    {
      name: 'recruit_get_candidate_profile',
      description:
        'Get full candidate profile including applications, evaluations, and scores.',
      params: {
        candidate_id: { type: 'string', description: 'Candidate ID', required: true },
      },
      execute: async (args) => {
        const candidate = await dbCandidates.getCandidate(client, args['candidate_id'] as string);

        const applications = await dbApplications.listApplications(client, tenantId, {
          candidateId: candidate.id,
        });

        const evaluationsByApp: Record<string, unknown[]> = {};
        const interviewsByApp: Record<string, unknown[]> = {};

        for (const app of applications) {
          evaluationsByApp[app.id] = await dbEvaluations.listEvaluations(client, app.id);
          interviewsByApp[app.id] = await dbInterviews.listInterviews(client, app.id);
        }

        return {
          success: true,
          candidate,
          applications,
          evaluations: evaluationsByApp,
          interviews: interviewsByApp,
        };
      },
    },

    // 10. recruit_rank_candidates
    {
      name: 'recruit_rank_candidates',
      description: 'Rank candidates for a job by match score.',
      params: {
        job_id: { type: 'string', description: 'Job ID', required: true },
        limit: { type: 'number', description: 'Max results (default 10)', default: 10 },
      },
      execute: async (args) => {
        const job = await dbJobs.getJob(client, args['job_id'] as string);
        const applications = await dbApplications.listApplications(client, tenantId, {
          jobId: job.id,
        });

        // Score and rank all candidates
        const ranked: Array<{
          candidate_id: string;
          application_id: string;
          score: number;
          stage: string;
        }> = [];

        for (const app of applications) {
          try {
            const candidate = await dbCandidates.getCandidate(client, app.candidate_id);
            const result = scoreCandidate(candidate, job);
            ranked.push({
              candidate_id: candidate.id,
              application_id: app.id,
              score: result.total,
              stage: app.stage,
            });
          } catch {
            logger.warn(`Could not score candidate ${app.candidate_id}`);
          }
        }

        ranked.sort((a, b) => b.score - a.score);
        const limit = (args['limit'] as number) ?? 10;

        return {
          success: true,
          job_title: job.title,
          total_applicants: applications.length,
          rankings: ranked.slice(0, limit),
        };
      },
    },

    // 11. recruit_get_job_analytics
    {
      name: 'recruit_get_job_analytics',
      description:
        'Get analytics for a job: time to hire, source effectiveness, stage conversion rates.',
      params: {
        job_id: { type: 'string', description: 'Job ID', required: true },
      },
      execute: async (args) => {
        const job = await dbJobs.getJob(client, args['job_id'] as string);
        const applications = await dbApplications.listApplications(client, tenantId, {
          jobId: job.id,
        });

        const metrics = analyzePipeline(applications);
        const timeToHire = predictTimeToHire(applications);
        const dropoffs = identifyDropoffPoints(applications);

        // Source effectiveness
        const sourceEffectiveness: Record<
          string,
          { total: number; screened: number; interviewed: number; hired: number }
        > = {};

        for (const app of applications) {
          try {
            const candidate = await dbCandidates.getCandidate(client, app.candidate_id);
            const source = candidate.source;
            if (!sourceEffectiveness[source]) {
              sourceEffectiveness[source] = { total: 0, screened: 0, interviewed: 0, hired: 0 };
            }
            const entry = sourceEffectiveness[source]!;
            entry.total++;
            if (['screening', 'phone_screen', 'interview', 'technical', 'offer', 'hired'].includes(app.stage)) {
              entry.screened++;
            }
            if (['interview', 'technical', 'offer', 'hired'].includes(app.stage)) {
              entry.interviewed++;
            }
            if (app.stage === 'hired') {
              entry.hired++;
            }
          } catch {
            // skip
          }
        }

        return {
          success: true,
          job: { id: job.id, title: job.title, status: job.status },
          total_applicants: applications.length,
          pipeline_metrics: metrics,
          predicted_time_to_hire_days: timeToHire,
          dropoff_points: dropoffs,
          source_effectiveness: sourceEffectiveness,
        };
      },
    },

    // 12. recruit_bulk_screen
    {
      name: 'recruit_bulk_screen',
      description: 'Screen all unscreened applicants for a job.',
      params: {
        job_id: { type: 'string', description: 'Job ID', required: true },
      },
      execute: async (args) => {
        const job = await dbJobs.getJob(client, args['job_id'] as string);
        const applications = await dbApplications.listApplications(client, tenantId, {
          jobId: job.id,
          stage: 'applied',
        });

        const results: Array<{
          application_id: string;
          candidate_id: string;
          score: number;
        }> = [];

        for (const app of applications) {
          try {
            const candidate = await dbCandidates.getCandidate(client, app.candidate_id);
            const result = scoreCandidate(candidate, job);

            await dbApplications.updateApplicationScore(
              client,
              app.id,
              result.total,
              result.breakdown.skills_match,
            );
            await dbApplications.updateApplicationStage(client, app.id, 'screening');

            results.push({
              application_id: app.id,
              candidate_id: candidate.id,
              score: result.total,
            });
          } catch (err) {
            logger.error(`Failed to screen application ${app.id}:`, err);
          }
        }

        return {
          success: true,
          job_title: job.title,
          screened_count: results.length,
          results: results.sort((a, b) => b.score - a.score),
        };
      },
    },

    // 13. recruit_status
    {
      name: 'recruit_status',
      description: 'Check Lucid Recruit system health and configuration status.',
      params: {},
      execute: async () => {
        let dbHealthy = false;
        try {
          const { error } = await client.from('recruit_jobs').select('id').limit(1);
          dbHealthy = !error;
        } catch {
          dbHealthy = false;
        }

        return {
          success: true,
          plugin: 'lucid-recruit',
          version: '1.0.0',
          tenant_id: tenantId,
          database: dbHealthy ? 'connected' : 'disconnected',
          auto_screen: config.autoScreenEnabled,
          screen_schedule: config.screenSchedule,
          providers: {
            linkedin: !!config.linkedinApiKey,
            github: !!config.githubToken,
            lever: !!config.leverApiKey,
            greenhouse: !!config.greenhouseApiKey,
          },
          integrations: {
            slack: !!config.slackWebhookUrl,
          },
        };
      },
    },
  ];
}
