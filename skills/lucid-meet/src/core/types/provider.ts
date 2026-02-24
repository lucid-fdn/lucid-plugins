// ---------------------------------------------------------------------------
// provider.ts -- Provider interfaces for external integrations
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  location?: string;
  description?: string;
}

export interface CalendarProvider {
  name: string;
  isConfigured(): boolean;
  listEvents(from: string, to: string): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
}

export interface NotificationProvider {
  name: string;
  isConfigured(): boolean;
  sendMessage(channel: string, message: string): Promise<void>;
  createChannel?(name: string): Promise<string>;
}

export interface NotesProvider {
  name: string;
  isConfigured(): boolean;
  createPage(title: string, content: string, parentId?: string): Promise<string>;
}

export interface ProviderRegistry {
  calendar: CalendarProvider | null;
  notification: NotificationProvider | null;
  notes: NotesProvider | null;
  getConfiguredNames(): string[];
}
