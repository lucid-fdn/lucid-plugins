import type { ToolDefinition } from './types.js';
import { createProposalTool } from './create-proposal.js';
import { analyzeRfpTool } from './analyze-rfp.js';
import { generateSectionTool } from './generate-section.js';
import { scoreProposalTool } from './score-proposal.js';
import { manageTemplatesTool } from './manage-templates.js';
import { searchContentTool } from './search-content.js';
import { calculatePricingTool } from './calculate-pricing.js';
import { getAnalyticsTool } from './get-analytics.js';
import { compareProposalsTool } from './compare-proposals.js';
import { statusTool } from './status.js';

export const ALL_TOOLS: ToolDefinition[] = [
  createProposalTool,
  analyzeRfpTool,
  generateSectionTool,
  scoreProposalTool,
  manageTemplatesTool,
  searchContentTool,
  calculatePricingTool,
  getAnalyticsTool,
  compareProposalsTool,
  statusTool,
];

export {
  createProposalTool,
  analyzeRfpTool,
  generateSectionTool,
  scoreProposalTool,
  manageTemplatesTool,
  searchContentTool,
  calculatePricingTool,
  getAnalyticsTool,
  compareProposalsTool,
  statusTool,
};

export type { ToolDefinition, ToolResult } from './types.js';
export { toolResult, toolError } from './types.js';
