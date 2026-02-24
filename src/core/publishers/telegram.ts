import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';
import { truncate } from '../utils/text.js';

export interface TelegramPublisherOptions {
  botToken?: string;
  chatId?: string;
}

/** Telegram Bot API message length limit. */
const TELEGRAM_MAX_LENGTH = 4096;

export class TelegramPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'telegram';
  readonly name = 'Telegram';

  private readonly botToken: string | undefined;
  private readonly chatId: string | undefined;

  constructor(options: TelegramPublisherOptions) {
    super();
    this.botToken = options.botToken;
    this.chatId = options.chatId;
  }

  isConfigured(): boolean {
    return Boolean(this.botToken) && Boolean(this.chatId);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.botToken || !this.chatId) {
      return {
        success: false,
        platform: this.platform,
        error: 'Telegram is not configured: missing botToken or chatId',
      };
    }

    const text = truncate(
      `*${input.title}*\n\n${input.content}`,
      TELEGRAM_MAX_LENGTH,
    );

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    log.debug(`Sending Telegram message to chat ${this.chatId} (${text.length} chars)`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `Telegram API responded with ${response.status}: ${errorBody}`,
      };
    }

    const data = (await response.json()) as {
      ok?: boolean;
      result?: { message_id?: number };
    };

    const messageId = data.result?.message_id;

    log.info(`Telegram message sent: message_id=${messageId ?? 'unknown'}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl: messageId
        ? `https://t.me/c/${this.chatId}/${messageId}`
        : undefined,
    };
  }
}
