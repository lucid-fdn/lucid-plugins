// ---------------------------------------------------------------------------
// prompts.ts -- AI prompt templates for meeting analysis
// ---------------------------------------------------------------------------

import type { Meeting, ActionItem, Decision } from '../types/database.js';
import { formatDuration, formatList } from '../utils/text.js';

export const MEETING_SUMMARY_PROMPT = `You are an expert meeting analyst. Analyze the meeting transcript provided and generate a comprehensive, well-structured summary. Focus on:

1. **Key Discussion Points**: The main topics discussed, in order of importance.
2. **Outcomes**: What was accomplished during this meeting.
3. **Open Questions**: Any unresolved questions or topics that need follow-up.
4. **Tone & Sentiment**: The overall tone of the meeting (collaborative, contentious, productive, etc.).

Be concise but thorough. Use bullet points for clarity. Do not include filler words or unnecessary context.`;

export const ACTION_EXTRACTION_PROMPT = `You are an expert at extracting action items from meeting transcripts. For each action item, identify:

1. **Task**: What needs to be done (clear, specific, actionable)
2. **Owner**: Who is responsible (name or role)
3. **Due Date**: Any mentioned deadline or timeframe
4. **Priority**: Based on urgency language (urgent, high, medium, low)
5. **Context**: Brief context from the discussion

Extract ALL action items, explicit and implicit. An implicit action item is when someone volunteers to do something or when the group expects someone to follow up.`;

export const DECISION_EXTRACTION_PROMPT = `You are an expert at identifying decisions made during meetings. For each decision, extract:

1. **Decision**: What was decided (clear statement)
2. **Rationale**: Why this decision was made
3. **Decided By**: Who made or approved the decision
4. **Impact**: What this decision affects
5. **Follow-up Required**: Any actions needed to implement the decision

Include both formal decisions (voted on, explicitly agreed) and informal decisions (consensus reached, direction set).`;

export const FOLLOW_UP_PROMPT = `You are a professional meeting follow-up writer. Based on the meeting details provided, draft a follow-up message that:

1. Thanks participants for their time
2. Summarizes key discussion points
3. Lists all action items with owners and deadlines
4. Highlights important decisions made
5. Notes any upcoming meetings or next steps

Keep the tone professional but warm. Use bullet points for action items.`;

export function buildMeetingSummaryPrompt(meeting: Meeting): string {
  const sections: string[] = [];

  sections.push(`## Meeting: ${meeting.title}`);
  sections.push(`- **Type**: ${meeting.type}`);
  sections.push(`- **Status**: ${meeting.status}`);
  sections.push(`- **Scheduled**: ${meeting.scheduled_at}`);
  if (meeting.duration_minutes) {
    sections.push(`- **Duration**: ${formatDuration(meeting.duration_minutes)}`);
  }
  if (meeting.attendees?.length > 0) {
    const names = meeting.attendees.map((a) => a.name);
    sections.push(`- **Attendees**: ${formatList(names)}`);
  }
  sections.push('');

  if (meeting.transcript) {
    sections.push('## Transcript');
    sections.push(meeting.transcript);
    sections.push('');
  }

  if (meeting.summary) {
    sections.push('## Existing Summary');
    sections.push(meeting.summary);
    sections.push('');
  }

  if (meeting.key_topics?.length > 0) {
    sections.push('## Key Topics');
    for (const topic of meeting.key_topics) {
      sections.push(`- ${topic}`);
    }
    sections.push('');
  }

  sections.push('Please provide a comprehensive analysis of this meeting.');

  return sections.join('\n');
}

export function buildTranscriptAnalysisPrompt(transcript: string): string {
  return [
    '## Meeting Transcript for Analysis',
    '',
    transcript,
    '',
    'Please analyze this transcript and extract:',
    '1. A concise summary (2-3 paragraphs)',
    '2. All action items (with assignees and deadlines if mentioned)',
    '3. All decisions made',
    '4. Key discussion topics',
    '5. Overall sentiment',
  ].join('\n');
}

export function buildFollowUpPrompt(
  meeting: Meeting,
  actions: ActionItem[],
  decisions: Decision[],
): string {
  const sections: string[] = [];

  sections.push(`## Follow-Up for: ${meeting.title}`);
  sections.push(`- **Date**: ${meeting.scheduled_at}`);
  if (meeting.attendees?.length > 0) {
    sections.push(`- **Attendees**: ${formatList(meeting.attendees.map((a) => a.name))}`);
  }
  sections.push('');

  if (meeting.summary) {
    sections.push('## Summary');
    sections.push(meeting.summary);
    sections.push('');
  }

  if (actions.length > 0) {
    sections.push('## Action Items');
    for (const action of actions) {
      const due = action.due_date ? ` (due: ${action.due_date})` : '';
      sections.push(`- [ ] **${action.title}** — ${action.assignee}${due} [${action.priority}]`);
    }
    sections.push('');
  }

  if (decisions.length > 0) {
    sections.push('## Decisions');
    for (const d of decisions) {
      sections.push(`- **${d.title}**: ${d.description ?? 'No details'} (by ${d.decided_by})`);
    }
    sections.push('');
  }

  sections.push('Please draft a professional follow-up message based on this meeting data.');

  return sections.join('\n');
}
