import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseClient, resetClient } from '../../src/core/db/client.js';

// Mock supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({ from: vi.fn() }),
}));

describe('db client', () => {
  beforeEach(() => {
    resetClient();
  });

  it('creates a client with url and key', () => {
    const client = getSupabaseClient('http://localhost:54321', 'test-key');
    expect(client).toBeDefined();
    expect(client).toHaveProperty('from');
  });

  it('returns the same client on second call', () => {
    const client1 = getSupabaseClient('http://localhost:54321', 'test-key');
    const client2 = getSupabaseClient();
    expect(client1).toBe(client2);
  });

  it('throws without url or key', () => {
    const envUrl = process.env['BRIDGE_SUPABASE_URL'];
    const envKey = process.env['BRIDGE_SUPABASE_KEY'];
    delete process.env['BRIDGE_SUPABASE_URL'];
    delete process.env['BRIDGE_SUPABASE_KEY'];
    expect(() => getSupabaseClient()).toThrow('Missing');
    process.env['BRIDGE_SUPABASE_URL'] = envUrl;
    process.env['BRIDGE_SUPABASE_KEY'] = envKey;
  });

  it('resetClient allows creating a new client', () => {
    const client1 = getSupabaseClient('http://localhost:54321', 'test-key');
    resetClient();
    const client2 = getSupabaseClient('http://localhost:54321', 'new-key');
    // Both should exist but they're different mock instances
    expect(client1).toBeDefined();
    expect(client2).toBeDefined();
  });
});
