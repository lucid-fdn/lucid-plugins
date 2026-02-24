import type { SectionType } from '../types/common.js';

export const PROPOSAL_GENERATION_PROMPT = `You are an expert proposal writer. Generate a professional, compelling proposal section based on the provided context. Focus on:
- Clear, concise language
- Specific, measurable outcomes
- Client-centric benefits
- Professional tone
- Evidence-based claims`;

export const RFP_RESPONSE_PROMPT = `You are an expert RFP response analyst. Analyze the provided RFP document and:
1. Identify all explicit and implicit requirements
2. Note evaluation criteria and their weights
3. Flag important deadlines
4. Identify budget constraints or hints
5. Highlight key themes and priorities
Be thorough and systematic in your analysis.`;

export const EXECUTIVE_SUMMARY_PROMPT = `Write a compelling executive summary that:
- Opens with a powerful statement about the client's challenge
- Clearly states the proposed solution
- Highlights 3-5 key benefits
- Includes a clear call to action
- Keeps the tone professional yet engaging
- Stays concise (250-400 words)`;

const SECTION_PROMPTS: Record<SectionType, string> = {
  executive_summary: EXECUTIVE_SUMMARY_PROMPT,
  problem_statement: `Write a clear problem statement that:
- Demonstrates deep understanding of the client's challenges
- Quantifies the impact of the problem where possible
- Creates urgency for solving it
- Shows empathy for the client's situation
- Connects to broader business objectives`,
  solution: `Describe the proposed solution that:
- Directly addresses each identified problem
- Explains the approach in clear, non-jargon terms
- Highlights unique differentiators
- Includes specific deliverables
- Shows how it integrates with existing systems`,
  methodology: `Outline the methodology that:
- Describes the step-by-step approach
- Identifies key phases and activities
- Explains quality assurance processes
- Addresses risk mitigation strategies
- Shows flexibility and adaptability`,
  timeline: `Create a project timeline that:
- Breaks the project into clear phases
- Identifies key milestones and deliverables
- Specifies realistic durations
- Highlights dependencies
- Includes review and approval points`,
  team: `Present the project team that:
- Introduces key team members and their roles
- Highlights relevant experience and qualifications
- Shows organizational structure
- Demonstrates capacity and availability
- Includes certifications or special skills`,
  pricing: `Prepare a pricing section that:
- Clearly breaks down all costs
- Explains the pricing model
- Identifies what is included and excluded
- Provides payment terms and schedule
- Offers options or tiers if applicable`,
  case_study: `Write a relevant case study that:
- Describes a similar project or client
- Outlines the challenge faced
- Explains the solution implemented
- Quantifies the results achieved
- Draws parallels to the current opportunity`,
  references: `Compile references that:
- Include 3-5 relevant client references
- Cover similar industries or project types
- Provide contact information
- Summarize the work performed
- Highlight measurable outcomes`,
  terms: `Draft terms and conditions that:
- Define scope boundaries clearly
- Specify payment terms and schedules
- Address intellectual property rights
- Include warranty and support terms
- Cover change order procedures`,
  appendix: `Prepare appendix materials that:
- Support claims made in the main proposal
- Include detailed technical specifications
- Provide additional case studies or data
- Contain relevant certifications
- Add supplementary team resumes`,
  custom: `Write a custom section that:
- Addresses the specific topic thoroughly
- Maintains consistency with the overall proposal
- Provides supporting evidence
- Uses clear, professional language
- Adds value to the overall narrative`,
};

/**
 * Build a full prompt for generating a proposal section.
 */
export function buildProposalPrompt(
  sectionType: SectionType,
  context: {
    clientName?: string;
    companyName?: string;
    projectTitle?: string;
    additionalContext?: string;
  } = {},
): string {
  const sectionPrompt = SECTION_PROMPTS[sectionType];

  let prompt = `${PROPOSAL_GENERATION_PROMPT}\n\n## Section: ${sectionType.replace(/_/g, ' ').toUpperCase()}\n\n${sectionPrompt}`;

  if (context.clientName) {
    prompt += `\n\nClient: ${context.clientName}`;
  }
  if (context.companyName) {
    prompt += `\nCompany: ${context.companyName}`;
  }
  if (context.projectTitle) {
    prompt += `\nProject: ${context.projectTitle}`;
  }
  if (context.additionalContext) {
    prompt += `\n\nAdditional Context:\n${context.additionalContext}`;
  }

  return prompt;
}
