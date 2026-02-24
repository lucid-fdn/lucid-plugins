import { vi } from 'vitest';

process.env['BRIDGE_SUPABASE_URL'] = 'http://localhost:54321';
process.env['BRIDGE_SUPABASE_KEY'] = 'test-key-for-bridge-testing';
process.env['BRIDGE_TENANT_ID'] = 'test-tenant-001';

// Silence logger during tests
vi.mock('../src/core/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
