import Bottleneck from 'bottleneck';
import type { Platform } from '../types/common.js';
import { logger } from '../../core/utils/logger.js';
import { BridgeError } from '../../core/utils/errors.js';

export interface ProviderSearchResult {
  id: string;
  title: string;
  url?: string;
  description?: string;
  platform: Platform;
  entity_type: string;
  updated_at?: string;
}

export interface ProviderTask {
  id: string;
  title: string;
  description?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  url?: string;
  labels?: string[];
  created_at?: string;
  updated_at?: string;
}

export abstract class BaseProvider {
  public readonly platform: Platform;
  protected limiter: Bottleneck;

  constructor(platform: Platform, maxConcurrent: number = 5, minTime: number = 200) {
    this.platform = platform;
    this.limiter = new Bottleneck({
      maxConcurrent,
      minTime,
    });
  }

  protected async rateLimited<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(fn);
  }

  abstract isConnected(): Promise<boolean>;
  abstract search(query: string): Promise<ProviderSearchResult[]>;
  abstract getEntity(id: string): Promise<Record<string, unknown> | null>;
  abstract createTask(task: Partial<ProviderTask>): Promise<ProviderTask>;
  abstract sendNotification(target: string, message: string): Promise<boolean>;

  protected handleError(message: string, cause?: unknown): never {
    logger.error(`[${this.platform}] ${message}`, { cause: String(cause) });
    throw BridgeError.platformError(this.platform, message, cause);
  }
}
