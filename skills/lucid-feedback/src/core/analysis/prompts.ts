// ---------------------------------------------------------------------------
// prompts.ts -- AI prompt templates for feedback analysis
// ---------------------------------------------------------------------------

import type { NpsResult, TrendData } from './trend-detector.js';
import type { Theme } from './sentiment-analyzer.js';
import type { FeatureRequest } from './categorizer.js';
import { formatPct } from '../utils/text.js';

export const FEEDBACK_ANALYSIS_PROMPT = `You are a customer feedback analyst. Analyze the provided feedback and generate actionable insights. Focus on:

1. **Sentiment Assessment**: What is the overall tone? Is the customer satisfied, frustrated, or neutral?
2. **Category**: What aspect of the product/service does this feedback address?
3. **Key Issues**: What specific problems or praise points are mentioned?
4. **Action Items**: What concrete steps should the team take in response?
5. **Priority**: How urgent is this feedback? Does it indicate a blocker or a nice-to-have?

Be specific and actionable. Reference exact phrases from the feedback to support your analysis.`;

export const NPS_REPORT_PROMPT = `You are a customer success analyst reviewing NPS data. Generate a clear report covering:

1. **NPS Score Summary**: Current score and what it means for the business.
2. **Segment Breakdown**: Distribution of detractors, passives, and promoters.
3. **Trend Analysis**: Is NPS improving or declining?
4. **Key Drivers**: What themes appear in each segment?
5. **Recommendations**: Specific actions to improve NPS.

Focus on actionable insights that can directly improve customer satisfaction.`;

export const RESPONSE_PROMPT = `You are a customer success representative crafting a response to customer feedback. The response should:

1. **Acknowledge**: Show the customer their feedback was heard.
2. **Empathize**: Demonstrate understanding of their experience.
3. **Address**: Respond to specific points they raised.
4. **Action**: Explain what steps will be taken (if applicable).
5. **Follow-up**: Offer to continue the conversation.

Keep the tone professional, warm, and genuine. Avoid generic responses.`;

export function buildNpsReportPrompt(nps: NpsResult, themes: Theme[]): string {
  const sections: string[] = [];

  sections.push('## NPS Report');
  sections.push(`- **NPS Score**: ${nps.nps}`);
  sections.push(`- **Total Responses**: ${nps.total}`);
  sections.push(`- **Promoters**: ${nps.promoters} (${formatPct(nps.promoter_pct)})`);
  sections.push(`- **Passives**: ${nps.passives} (${formatPct(nps.passive_pct)})`);
  sections.push(`- **Detractors**: ${nps.detractors} (${formatPct(nps.detractor_pct)})`);
  sections.push('');

  if (themes.length > 0) {
    sections.push('## Top Themes');
    for (const theme of themes.slice(0, 5)) {
      sections.push(`- **${theme.name}** (${theme.count} mentions, sentiment: ${theme.sentiment_avg.toFixed(2)})`);
      sections.push(`  Keywords: ${theme.keywords.join(', ')}`);
    }
    sections.push('');
  }

  sections.push('Please provide your comprehensive NPS analysis based on this data.');
  return sections.join('\n');
}

export function buildInsightsSummary(
  trends: TrendData[],
  themes: Theme[],
  featureRequests: FeatureRequest[],
  nps: NpsResult | null,
): string {
  const sections: string[] = [];

  sections.push('## Feedback Insights Summary');
  sections.push('');

  if (nps) {
    sections.push('### NPS Overview');
    sections.push(`- Score: ${nps.nps} | Promoters: ${formatPct(nps.promoter_pct)} | Detractors: ${formatPct(nps.detractor_pct)}`);
    sections.push('');
  }

  if (themes.length > 0) {
    sections.push('### Top Themes');
    for (const theme of themes.slice(0, 5)) {
      const sentLabel = theme.sentiment_avg > 0.2 ? 'positive' : theme.sentiment_avg < -0.2 ? 'negative' : 'mixed';
      sections.push(`- **${theme.name}**: ${theme.count} mentions (${sentLabel})`);
    }
    sections.push('');
  }

  if (featureRequests.length > 0) {
    sections.push('### Top Feature Requests');
    for (const req of featureRequests.slice(0, 5)) {
      sections.push(`- [${req.priority.toUpperCase()}] ${req.content.slice(0, 100)}${req.content.length > 100 ? '...' : ''}`);
    }
    sections.push('');
  }

  if (trends.length > 0) {
    const latest = trends[trends.length - 1];
    sections.push('### Latest Trend');
    sections.push(`- Period: ${latest.period}`);
    sections.push(`- Volume: ${latest.volume} items`);
    sections.push(`- Sentiment: ${latest.sentiment_avg}`);
    if (latest.change_pct !== null) {
      sections.push(`- Volume change: ${latest.change_pct > 0 ? '+' : ''}${latest.change_pct}%`);
    }
    sections.push('');
  }

  return sections.join('\n');
}
