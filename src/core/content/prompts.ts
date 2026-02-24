/**
 * Prompt builders for each supported content transformation format.
 *
 * Each function returns a { system, instruction } pair where:
 * - `system` is the system-level prompt that configures the LLM's persona
 * - `instruction` is the user-level instruction appended before the digest content
 */

export interface FormatPrompt {
  system: string;
  instruction: string;
}

/**
 * Build prompts for transforming a digest into a polished blog post.
 */
export function buildBlogPostPrompt(digestTitle: string, language: string): FormatPrompt {
  return {
    system: [
      `You are an expert tech blogger.`,
      `Transform this digest into a polished blog post in ${language}.`,
      `Include: engaging title, introduction, main sections with analysis, conclusion with takeaways.`,
      `Use markdown. Be thorough but readable.`,
    ].join(' '),
    instruction: [
      `Transform the following digest titled "${digestTitle}" into a complete blog post.`,
      `Write in ${language}. Use clear section headings, smooth transitions, and a professional tone.`,
      `Start with a compelling title (using a # heading), then an introduction that hooks the reader,`,
      `followed by well-structured body sections, and end with key takeaways.`,
    ].join(' '),
  };
}

/**
 * Build prompts for transforming a digest into a Twitter/X thread.
 */
export function buildXThreadPrompt(digestTitle: string, language: string): FormatPrompt {
  return {
    system: [
      `Transform this digest into a Twitter/X thread in ${language}.`,
      `Rules: each tweet max 280 chars, number them (1/N format),`,
      `first tweet is hook, last tweet is CTA/summary,`,
      `use line breaks between tweets. Format as numbered list.`,
    ].join(' '),
    instruction: [
      `Transform the following digest titled "${digestTitle}" into a Twitter/X thread.`,
      `Write in ${language}. Format each tweet as "N/Total) tweet text".`,
      `Keep each tweet under 280 characters. The first tweet should be an attention-grabbing hook.`,
      `The last tweet should summarize the key takeaway and include a call to action.`,
      `Separate each tweet with a blank line.`,
    ].join(' '),
  };
}

/**
 * Build prompts for transforming a digest into a LinkedIn post.
 */
export function buildLinkedInPrompt(digestTitle: string, language: string): FormatPrompt {
  return {
    system: [
      `Transform this digest into a LinkedIn post in ${language}.`,
      `Max 1300 characters.`,
      `Include: attention-grabbing hook, 3-4 key insights with emoji bullets,`,
      `engagement question at the end, relevant hashtags.`,
    ].join(' '),
    instruction: [
      `Transform the following digest titled "${digestTitle}" into a LinkedIn post.`,
      `Write in ${language}. Keep it under 1300 characters total.`,
      `Start with a bold hook line that stops the scroll.`,
      `Use emoji bullets for 3-4 key insights from the digest.`,
      `End with a thought-provoking question to drive engagement, followed by 3-5 relevant hashtags.`,
    ].join(' '),
  };
}

/**
 * Build prompts for transforming a digest into an email newsletter.
 */
export function buildNewsletterPrompt(digestTitle: string, language: string): FormatPrompt {
  return {
    system: [
      `Transform this digest into an email newsletter in ${language}.`,
      `Structure: subject line, preview text, greeting, executive summary,`,
      `detailed sections, CTA, sign-off.`,
      `Use markdown that converts well to email HTML.`,
    ].join(' '),
    instruction: [
      `Transform the following digest titled "${digestTitle}" into an email newsletter.`,
      `Write in ${language}. Structure it as follows:`,
      `- **Subject:** a compelling email subject line`,
      `- **Preview:** a short preview text (under 100 chars)`,
      `- **Greeting:** a warm, professional greeting`,
      `- **Executive Summary:** 2-3 sentence overview`,
      `- **Detailed Sections:** key topics with analysis, using markdown headings and formatting`,
      `- **CTA:** a clear call to action`,
      `- **Sign-off:** a professional closing`,
    ].join('\n'),
  };
}
