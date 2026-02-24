import type { Publisher, PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { log } from '../utils/logger.js';

export abstract class BasePublisher implements Publisher {
  abstract readonly platform: PublishPlatform;
  abstract readonly name: string;

  abstract isConfigured(): boolean;

  protected abstract doPublish(input: PublishInput): Promise<PublishResult>;

  async publish(input: PublishInput): Promise<PublishResult> {
    log.info(`Publishing to ${this.name}: ${input.title}`);

    try {
      return await this.doPublish(input);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`Publish to ${this.name} failed: ${msg}`);
      return { success: false, platform: this.platform, error: msg };
    }
  }
}
