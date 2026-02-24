import type { RfpAnalysis, Requirement, Criterion } from '../types/database.js';

/**
 * Analyze RFP content to extract requirements, criteria, deadlines, budget hints, and themes.
 */
export function analyzeRfp(content: string): RfpAnalysis {
  return {
    requirements: extractRequirements(content),
    evaluation_criteria: detectEvaluationCriteria(content),
    deadlines: extractDeadlines(content),
    budget_hints: extractBudgetHints(content),
    key_themes: identifyKeyThemes(content),
  };
}

/**
 * Extract requirements from RFP text.
 */
export function extractRequirements(text: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = text.split('\n');
  let reqIndex = 0;

  const mustHavePatterns = [
    /\bmust\b/i,
    /\brequired\b/i,
    /\bshall\b/i,
    /\bmandatory\b/i,
    /\bessential\b/i,
  ];
  const niceToHavePatterns = [
    /\bshould\b/i,
    /\bpreferred\b/i,
    /\bdesirable\b/i,
    /\brecommended\b/i,
  ];
  const optionalPatterns = [/\bmay\b/i, /\boptional\b/i, /\bif possible\b/i, /\bnice to have\b/i];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;

    const isMustHave = mustHavePatterns.some((p) => p.test(trimmed));
    const isNiceToHave = niceToHavePatterns.some((p) => p.test(trimmed));
    const isOptional = optionalPatterns.some((p) => p.test(trimmed));

    if (isMustHave || isNiceToHave || isOptional) {
      reqIndex++;
      const priority = isMustHave ? 'must_have' : isNiceToHave ? 'nice_to_have' : 'optional';
      const category = categorizeRequirement(trimmed);

      requirements.push({
        id: `REQ-${String(reqIndex).padStart(3, '0')}`,
        description: trimmed,
        priority,
        category,
      });
    }
  }

  return requirements;
}

/**
 * Detect evaluation criteria from RFP text.
 */
export function detectEvaluationCriteria(text: string): Criterion[] {
  const criteria: Criterion[] = [];
  const lower = text.toLowerCase();

  const commonCriteria: Array<{ name: string; keywords: string[]; defaultWeight: number }> = [
    {
      name: 'Technical Approach',
      keywords: ['technical', 'approach', 'methodology', 'solution'],
      defaultWeight: 30,
    },
    {
      name: 'Experience & Qualifications',
      keywords: ['experience', 'qualification', 'past performance', 'references'],
      defaultWeight: 25,
    },
    {
      name: 'Cost / Price',
      keywords: ['cost', 'price', 'pricing', 'budget', 'fee'],
      defaultWeight: 20,
    },
    {
      name: 'Team & Resources',
      keywords: ['team', 'staff', 'personnel', 'resources'],
      defaultWeight: 15,
    },
    {
      name: 'Timeline & Schedule',
      keywords: ['timeline', 'schedule', 'delivery', 'milestone'],
      defaultWeight: 10,
    },
  ];

  for (const criterion of commonCriteria) {
    const found = criterion.keywords.some((kw) => lower.includes(kw));
    if (found) {
      const weight = extractWeight(text, criterion.name) ?? criterion.defaultWeight;
      criteria.push({
        name: criterion.name,
        weight,
        description: `Evaluation based on ${criterion.keywords.join(', ')}`,
      });
    }
  }

  // Normalize weights to 100
  if (criteria.length > 0) {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      for (const c of criteria) {
        c.weight = Math.round((c.weight / totalWeight) * 100);
      }
    }
  }

  return criteria;
}

/**
 * Identify key themes in the RFP.
 */
export function identifyKeyThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const themes: string[] = [];

  const themeMap: Record<string, string[]> = {
    'Digital Transformation': ['digital transformation', 'modernization', 'digital', 'automation'],
    'Cloud & Infrastructure': ['cloud', 'infrastructure', 'aws', 'azure', 'gcp', 'saas'],
    'Security & Compliance': ['security', 'compliance', 'gdpr', 'hipaa', 'sox', 'encryption'],
    'Data & Analytics': ['data', 'analytics', 'reporting', 'dashboard', 'insights', 'bi'],
    Integration: ['integration', 'api', 'interoperability', 'connectivity'],
    Scalability: ['scalability', 'scalable', 'performance', 'high availability'],
    'User Experience': ['user experience', 'ux', 'ui', 'usability', 'accessibility'],
    'Cost Optimization': ['cost optimization', 'roi', 'cost reduction', 'efficiency'],
    Innovation: ['innovation', 'innovative', 'cutting-edge', 'emerging technology'],
    'Support & Maintenance': ['support', 'maintenance', 'sla', 'uptime', 'monitoring'],
  };

  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Estimate win probability based on proposal and RFP analysis alignment.
 */
export function estimateWinProbability(
  sectionCount: number,
  requirementsMet: number,
  totalRequirements: number,
  hasCompetitivePricing: boolean,
): number {
  let probability = 30;

  if (totalRequirements > 0) {
    probability += Math.round((requirementsMet / totalRequirements) * 30);
  }

  if (sectionCount >= 5) probability += 20;
  else if (sectionCount >= 3) probability += 10;
  else if (sectionCount >= 1) probability += 5;

  if (hasCompetitivePricing) probability += 20;

  return Math.min(95, Math.max(5, probability));
}

function categorizeRequirement(text: string): string {
  const lower = text.toLowerCase();

  if (/technical|software|hardware|system|platform/i.test(lower)) return 'technical';
  if (/security|compliance|privacy|encryption/i.test(lower)) return 'security';
  if (/performance|speed|latency|uptime/i.test(lower)) return 'performance';
  if (/report|dashboard|analytic/i.test(lower)) return 'reporting';
  if (/integrate|api|connect/i.test(lower)) return 'integration';
  if (/support|maintain|sla/i.test(lower)) return 'support';
  if (/train|document|onboard/i.test(lower)) return 'training';
  if (/budget|cost|price|fee/i.test(lower)) return 'financial';

  return 'general';
}

function extractWeight(text: string, criterionName: string): number | null {
  const escapedName = criterionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`${escapedName}[^\\d]*(\\d+)\\s*%`, 'i'),
    new RegExp(`${escapedName}[^\\d]*(\\d+)\\s*points`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

function extractDeadlines(text: string): string[] {
  const deadlines: string[] = [];

  // Match ISO dates
  const isoPattern = /\b(\d{4}-\d{2}-\d{2})\b/g;
  let match;
  while ((match = isoPattern.exec(text)) !== null) {
    if (match[1] && !deadlines.includes(match[1])) {
      deadlines.push(match[1]);
    }
  }

  // Match written dates like "January 15, 2025"
  const writtenPattern = /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/g;
  while ((match = writtenPattern.exec(text)) !== null) {
    if (match[1] && !deadlines.includes(match[1])) {
      deadlines.push(match[1]);
    }
  }

  return deadlines;
}

function extractBudgetHints(text: string): string[] {
  const hints: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /\$[\d,]+|budget|funding|allocation|not.to.exceed/i.test(trimmed) &&
      trimmed.length > 10
    ) {
      hints.push(trimmed);
    }
  }

  return hints;
}
