export interface PluginConfig {
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase anon/service key */
  supabaseKey: string;
  /** Tenant identifier */
  tenantId: string;

  /** Notion integration token */
  notionToken?: string;
  /** Linear API key */
  linearApiKey?: string;
  /** Slack bot token */
  slackBotToken?: string;
  /** GitHub personal access token */
  githubToken?: string;
  /** Jira instance host (e.g. yourorg.atlassian.net) */
  jiraHost?: string;
  /** Jira user email */
  jiraEmail?: string;
  /** Jira API token */
  jiraToken?: string;
  /** Google Workspace credentials JSON */
  googleCredentials?: string;
  /** Discord bot token */
  discordBotToken?: string;
  /** Trello API key */
  trelloApiKey?: string;
  /** Trello token */
  trelloToken?: string;
  /** Slack incoming webhook URL */
  slackWebhookUrl?: string;
  /** Cron schedule for sync (default: every 30 minutes) */
  syncSchedule: string;
}
