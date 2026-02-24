import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';

export interface OpenClawChannelPublisherOptions {
  api?: OpenClawApi;
}

/**
 * Minimal interface for the OpenClaw API object.
 * This will be expanded once the OpenClaw channel API is finalized.
 */
interface OpenClawApi {
  registerChannel?: (...args: unknown[]) => unknown;
  sendMessage?: (channel: string, message: unknown) => Promise<unknown>;
}

export class OpenClawChannelPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'openclaw_channel';
  readonly name = 'OpenClaw Channel';

  private readonly api: OpenClawApi | undefined;

  constructor(options: OpenClawChannelPublisherOptions) {
    super();
    this.api = options.api;
  }

  isConfigured(): boolean {
    if (!this.api) {
      return false;
    }

    try {
      return typeof this.api.registerChannel === 'function';
    } catch {
      return false;
    }
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.api) {
      return {
        success: false,
        platform: this.platform,
        error: 'OpenClaw Channel is not configured: missing API object',
      };
    }

    log.debug(`Publishing to OpenClaw Channel: "${input.title}"`);

    // If the API supports sendMessage, attempt to use it
    if (typeof this.api.sendMessage === 'function') {
      try {
        await this.api.sendMessage('lucid-veille', {
          title: input.title,
          content: input.content,
          format: input.format,
          metadata: input.metadata,
        });

        log.info(`OpenClaw Channel message sent: "${input.title}"`);

        return {
          success: true,
          platform: this.platform,
          externalUrl: undefined,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          platform: this.platform,
          error: `OpenClaw Channel sendMessage failed: ${msg}`,
        };
      }
    }

    // Stub implementation: format and return success for local-only channel
    log.info(
      `OpenClaw Channel (local-only stub): "${input.title}" — ` +
        `content length ${input.content.length} chars, format ${input.format}`,
    );

    return {
      success: true,
      platform: this.platform,
      externalUrl: undefined,
    };
  }
}
