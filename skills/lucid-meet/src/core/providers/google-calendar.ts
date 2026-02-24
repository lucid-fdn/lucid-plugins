// ---------------------------------------------------------------------------
// google-calendar.ts -- Google Calendar API integration
// ---------------------------------------------------------------------------

import type { CalendarProvider, CalendarEvent } from '../types/provider.js';
import { ProviderError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export class GoogleCalendarProvider implements CalendarProvider {
  readonly name = 'google-calendar';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async listEvents(from: string, to: string): Promise<CalendarEvent[]> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, 'Google Calendar API key not configured');
    }

    log.debug(`Listing calendar events from ${from} to ${to}`);

    try {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('timeMin', from);
      url.searchParams.set('timeMax', to);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('key', this.apiKey);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
      const items = data.items ?? [];

      return items.map((item) => ({
        id: String(item.id ?? ''),
        title: String(item.summary ?? 'Untitled'),
        start: String((item.start as Record<string, unknown>)?.dateTime ?? ''),
        end: String((item.end as Record<string, unknown>)?.dateTime ?? ''),
        attendees: ((item.attendees as Array<Record<string, unknown>>) ?? []).map((a) => String(a.email ?? '')),
        location: item.location ? String(item.location) : undefined,
        description: item.description ? String(item.description) : undefined,
      }));
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Failed to list events: ${msg}`);
    }
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, 'Google Calendar API key not configured');
    }

    log.debug(`Creating calendar event: ${event.title}`);

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          summary: event.title,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
          attendees: event.attendees.map((email) => ({ email })),
          location: event.location,
          description: event.description,
        }),
      });

      if (!res.ok) {
        throw new ProviderError(this.name, `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as Record<string, unknown>;
      return {
        id: String(data.id ?? ''),
        title: event.title,
        start: event.start,
        end: event.end,
        attendees: event.attendees,
        location: event.location,
        description: event.description,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new ProviderError(this.name, `Failed to create event: ${msg}`);
    }
  }
}
