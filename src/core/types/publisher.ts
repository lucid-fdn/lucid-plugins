import type { PublishPlatform, ContentFormat } from './common.js';

export interface PublishInput {
  content: string;
  title: string;
  format: ContentFormat;
  metadata?: Record<string, unknown>;
}

export interface PublishResult {
  success: boolean;
  platform: PublishPlatform;
  externalUrl?: string;
  error?: string;
}

export interface Publisher {
  readonly platform: PublishPlatform;
  readonly name: string;
  isConfigured(): boolean;
  publish(input: PublishInput): Promise<PublishResult>;
}
