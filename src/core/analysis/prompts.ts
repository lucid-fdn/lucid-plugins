// ---------------------------------------------------------------------------
// prompts.ts -- AI prompt templates for SEO content generation
// ---------------------------------------------------------------------------

export const SEO_CONTENT_PROMPT = `You are an expert SEO content strategist. Analyze the provided keyword data, SERP results, and competitive landscape to create optimized content recommendations.

Consider the following:
- Search intent alignment
- Content depth and comprehensiveness
- Keyword placement (title, headings, body, meta)
- Internal linking opportunities
- Featured snippet optimization
- E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)`;

export const KEYWORD_STRATEGY_PROMPT = `You are an SEO keyword strategist. Given the keyword research data, create a prioritized keyword strategy that considers:

- Search volume and traffic potential
- Keyword difficulty and competition
- Commercial intent and conversion potential
- Content gap opportunities
- Topic clustering for topical authority
- Long-tail keyword opportunities`;

export function buildSeoReportPrompt(domain: string, data: Record<string, unknown>): string {
  return `Generate a comprehensive SEO analysis report for ${domain}.

Data:
${JSON.stringify(data, null, 2)}

Include:
1. Executive summary
2. Key findings and issues
3. Prioritized recommendations
4. Quick wins vs long-term strategies
5. Competitive positioning assessment`;
}

export function buildContentBriefPrompt(
  keyword: string,
  serpData: Array<{ title: string; description: string; url: string }>,
  contentType: string,
): string {
  return `Create a detailed content brief for the keyword "${keyword}" as a ${contentType}.

Current SERP landscape:
${serpData.map((s, i) => `${i + 1}. ${s.title}\n   ${s.url}\n   ${s.description}`).join('\n\n')}

The content brief should include:
1. Recommended title (with keyword placement)
2. Meta description
3. Target word count
4. H1 and H2 structure
5. Key topics to cover
6. Internal linking suggestions
7. Featured snippet optimization tips
8. Unique angle to differentiate from competitors`;
}
