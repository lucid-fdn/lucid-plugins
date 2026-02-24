// ---------------------------------------------------------------------------
// prompts.ts -- AI-ready prompt templates for social growth analysis
// ---------------------------------------------------------------------------

import type { ContentOptimization, CampaignReport, InfluencerProfile } from '../types/index.js';

export const CONTENT_OPTIMIZATION_SYSTEM_PROMPT = `You are a social media growth expert. Analyze the content optimization data provided and generate actionable suggestions. Focus on:

1. **Content Quality**: Is the content engaging? Does it have a hook?
2. **Platform Fit**: Is the content optimized for the target platform?
3. **Hashtag Strategy**: Are the right hashtags being used?
4. **Call to Action**: Is there a clear CTA?
5. **Timing**: Is the content being posted at optimal times?
6. **Visual Elements**: Should media be added?

Be specific and actionable. Give exact rewrites where possible.`;

export const ENGAGEMENT_ANALYSIS_SYSTEM_PROMPT = `You are a social media analytics expert. Analyze the engagement data and provide insights on:

1. **Performance Trends**: What's working and what's not?
2. **Audience Behavior**: When and how does the audience engage?
3. **Content Strategy**: Which content types perform best?
4. **Growth Opportunities**: Where can engagement be improved?
5. **Competitive Positioning**: How does this compare to industry benchmarks?

Use data-driven language and reference specific metrics.`;

export const INFLUENCER_ANALYSIS_SYSTEM_PROMPT = `You are an influencer marketing strategist. Analyze the influencer data and provide:

1. **Best Fits**: Which influencers are the best match for the brand?
2. **ROI Potential**: Expected return from each influencer partnership.
3. **Audience Overlap**: How well does the influencer's audience match the target?
4. **Risk Assessment**: Any red flags (fake followers, low quality engagement)?
5. **Outreach Strategy**: How to approach each influencer.

Be practical and ROI-focused.`;

export function buildContentOptimizationPrompt(optimization: ContentOptimization): string {
  const lines: string[] = [];

  lines.push(`## Content Optimization Report: ${optimization.platform}`);
  lines.push(`- **Overall Score**: ${optimization.overallScore}/100`);
  lines.push(`- **Optimal Length**: ${optimization.optimalLength} characters`);
  lines.push(`- **Recommended Format**: ${optimization.recommendedFormat}`);
  lines.push('');

  if (optimization.recommendedHashtags.length > 0) {
    lines.push(`### Recommended Hashtags`);
    lines.push(optimization.recommendedHashtags.join(', '));
    lines.push('');
  }

  if (optimization.suggestions.length > 0) {
    lines.push('### Improvement Suggestions');
    for (const s of optimization.suggestions) {
      lines.push(`- **${s.area}** (impact: ${s.impact}/100)`);
      lines.push(`  Current: ${s.current}`);
      lines.push(`  Recommended: ${s.recommended}`);
    }
    lines.push('');
  }

  lines.push('Please provide specific content rewrites and optimization tips.');
  return lines.join('\n');
}

export function buildCampaignReportPrompt(report: CampaignReport): string {
  const lines: string[] = [];

  lines.push(`## Campaign Report: ${report.name}`);
  lines.push(`- **Status**: ${report.status}`);
  lines.push(`- **Total Posts**: ${report.totalPosts}`);
  lines.push(`- **Total Impressions**: ${report.totalImpressions.toLocaleString()}`);
  lines.push(`- **Total Engagement**: ${report.totalEngagement.toLocaleString()}`);
  lines.push(`- **Avg Engagement Rate**: ${report.avgEngagementRate.toFixed(2)}%`);
  lines.push(`- **Avg Virality Score**: ${report.viralityAvg.toFixed(1)}/100`);
  if (report.topPlatform) lines.push(`- **Top Platform**: ${report.topPlatform}`);
  lines.push('');

  if (report.recommendations.length > 0) {
    lines.push('### Recommendations');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  lines.push('');
  lines.push('Please provide a comprehensive analysis with next steps.');
  return lines.join('\n');
}

export function buildInfluencerOutreachPrompt(
  influencer: InfluencerProfile,
  productName: string,
  productDescription: string,
): string {
  const lines: string[] = [];

  lines.push(`## Influencer: ${influencer.name} (@${influencer.handle})`);
  lines.push(`- **Platform**: ${influencer.platform}`);
  lines.push(`- **Followers**: ${influencer.followers.toLocaleString()}`);
  lines.push(`- **Engagement Rate**: ${influencer.engagementRate.toFixed(2)}%`);
  lines.push(`- **Niche**: ${influencer.niche.join(', ')}`);
  lines.push(`- **Audience Quality**: ${(influencer.audienceQuality * 100).toFixed(0)}%`);
  lines.push('');
  lines.push(`## Product: ${productName}`);
  lines.push(productDescription);
  lines.push('');
  lines.push('Please draft a personalized outreach message for this influencer.');

  return lines.join('\n');
}
