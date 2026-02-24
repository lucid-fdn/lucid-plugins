export {
  calculateViralityScore,
  scoreToLevel,
  engagementVelocity,
  shareRatio,
  engagementRate,
  amplificationRatio,
  predictViralPotential,
} from './virality-scorer.js';
export type { ViralityInput } from './virality-scorer.js';

export {
  analyzeEngagement,
  findBestPostingTimes,
  analyzeSentiment,
  contentTypePerformance,
  generateAudienceSegments,
  totalEngagement,
  postEngagementRate,
  contentPostToPostData,
} from './engagement-analyzer.js';
export type { EngagementInput, PostData } from './engagement-analyzer.js';

export {
  optimizeContent,
  scoreLengthFit,
  scoreHashtags,
  scoreReadability,
  scoreCTA,
  generateSuggestions,
  recommendContentType,
} from './content-optimizer.js';
export type { ContentInput } from './content-optimizer.js';

export {
  rankInfluencers,
  computeCompositeScore,
  scoreEngagementRate,
  scoreAudienceQuality,
  scoreFollowerCount,
  scorePostFrequency,
  estimateReach,
  filterInfluencers,
  normalize,
  DEFAULT_WEIGHTS,
} from './influencer-ranker.js';
export type { RankingWeights } from './influencer-ranker.js';

export {
  CONTENT_OPTIMIZATION_SYSTEM_PROMPT,
  ENGAGEMENT_ANALYSIS_SYSTEM_PROMPT,
  INFLUENCER_ANALYSIS_SYSTEM_PROMPT,
  buildContentOptimizationPrompt,
  buildCampaignReportPrompt,
  buildInfluencerOutreachPrompt,
} from './prompts.js';
