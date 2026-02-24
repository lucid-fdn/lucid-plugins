// ---------------------------------------------------------------------------
// transcript-analyzer.ts -- Extract structured data from meeting transcripts
// ---------------------------------------------------------------------------

import type { ActionPriority, SentimentType } from '../types/common.js';

export interface ExtractedAction {
  title: string;
  assignee: string;
  dueHint: string | null;
  priority: ActionPriority;
}

export interface ExtractedDecision {
  title: string;
  description: string;
  decidedBy: string;
}

export interface TranscriptAnalysis {
  summary: string;
  actions: ExtractedAction[];
  decisions: ExtractedDecision[];
  keyTopics: string[];
  sentiment: SentimentType;
}

const ACTION_PATTERNS = [
  /(?:action item|todo|task|to-do)\s*[:;]\s*(.+)/gi,
  /(\w+)\s+(?:will|should|needs to|is going to|must)\s+(.+?)(?:\.|$)/gi,
  /(?:assigned to|owned by|@)\s*(\w+)\s*[:;]?\s*(.+?)(?:\.|$)/gi,
];

const DECISION_PATTERNS = [
  /(?:decided|agreed|approved|resolved|concluded)\s+(?:to\s+|that\s+)?(.+?)(?:\.|$)/gi,
  /(?:decision|conclusion|resolution)\s*[:;]\s*(.+?)(?:\.|$)/gi,
  /(?:we will|we'll|the team will)\s+(.+?)(?:\.|$)/gi,
];

const POSITIVE_WORDS = [
  'great',
  'excellent',
  'good',
  'amazing',
  'wonderful',
  'fantastic',
  'positive',
  'happy',
  'excited',
  'progress',
  'success',
  'achieved',
  'accomplished',
  'improved',
  'agree',
];

const NEGATIVE_WORDS = [
  'bad',
  'terrible',
  'poor',
  'awful',
  'negative',
  'frustrated',
  'angry',
  'concerned',
  'worried',
  'failed',
  'problem',
  'issue',
  'blocker',
  'delayed',
  'disagree',
];

export function extractActionItems(transcript: string): ExtractedAction[] {
  const actions: ExtractedAction[] = [];
  const seen = new Set<string>();

  for (const pattern of ACTION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(transcript)) !== null) {
      const fullMatch = match[0].trim();
      const key = fullMatch.toLowerCase().slice(0, 50);
      if (seen.has(key)) continue;
      seen.add(key);

      const groups = match.slice(1).filter(Boolean);
      const assignee = groups.length > 1 ? groups[0].trim() : 'unassigned';
      const title = groups.length > 1 ? groups[1].trim() : groups[0]?.trim() ?? fullMatch;

      actions.push({
        title: title.slice(0, 200),
        assignee,
        dueHint: extractDueHint(fullMatch),
        priority: inferPriority(fullMatch),
      });
    }
  }

  return actions;
}

export function extractDecisions(transcript: string): ExtractedDecision[] {
  const decisions: ExtractedDecision[] = [];
  const seen = new Set<string>();

  for (const pattern of DECISION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(transcript)) !== null) {
      const content = match[1]?.trim();
      if (!content || content.length < 5) continue;

      const key = content.toLowerCase().slice(0, 50);
      if (seen.has(key)) continue;
      seen.add(key);

      decisions.push({
        title: content.slice(0, 100),
        description: content,
        decidedBy: 'team',
      });
    }
  }

  return decisions;
}

export function extractKeyTopics(transcript: string): string[] {
  const words = transcript.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'it', 'i',
    'we', 'they', 'he', 'she', 'this', 'that', 'these', 'those', 'my',
    'your', 'our', 'their', 'its', 'not', 'no', 'so', 'if', 'then',
    'than', 'too', 'very', 'just', 'about', 'up', 'out', 'also', 'as',
    'from', 'all', 'what', 'when', 'where', 'how', 'who', 'which',
  ]);

  const freq = new Map<string, number>();
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length < 3 || stopWords.has(clean)) continue;
    freq.set(clean, (freq.get(clean) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export function analyzeSentiment(transcript: string): SentimentType {
  const lower = transcript.toLowerCase();
  const words = lower.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.includes(clean)) positiveCount++;
    if (NEGATIVE_WORDS.includes(clean)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 'neutral';
  if (positiveCount > 0 && negativeCount > 0) {
    const ratio = positiveCount / total;
    if (ratio > 0.7) return 'positive';
    if (ratio < 0.3) return 'negative';
    return 'mixed';
  }
  if (positiveCount > 0) return 'positive';
  return 'negative';
}

export function generateSummary(transcript: string): string {
  const sentences = transcript
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length === 0) return 'No substantial content to summarize.';
  if (sentences.length <= 3) return sentences.join('. ') + '.';

  // Take first, middle, and last key sentences
  const first = sentences[0];
  const middle = sentences[Math.floor(sentences.length / 2)];
  const last = sentences[sentences.length - 1];

  return `${first}. ${middle}. ${last}.`;
}

function extractDueHint(text: string): string | null {
  const patterns = [
    /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /by\s+(end of (?:day|week|month|sprint))/i,
    /(?:due|deadline)\s*[:;]?\s*(\S+)/i,
    /(?:before|until)\s+(next\s+\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function inferPriority(text: string): ActionPriority {
  const lower = text.toLowerCase();
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) return 'urgent';
  if (lower.includes('high priority') || lower.includes('important') || lower.includes('blocker')) return 'high';
  if (lower.includes('low priority') || lower.includes('nice to have') || lower.includes('optional')) return 'low';
  return 'medium';
}
