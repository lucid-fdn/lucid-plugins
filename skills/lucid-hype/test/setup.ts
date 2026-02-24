// ---------------------------------------------------------------------------
// test/setup.ts -- Global test setup: set required env vars
// ---------------------------------------------------------------------------

process.env.HYPE_SUPABASE_URL = 'http://localhost:54321';
process.env.HYPE_SUPABASE_KEY = 'test-key';
process.env.HYPE_PRODUCT_NAME = 'Test Product';
process.env.HYPE_PRODUCT_DESCRIPTION = 'A test product for unit tests';
process.env.HYPE_PRODUCT_URL = 'https://test.example.com';
