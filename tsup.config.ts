import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    mcp: 'src/mcp.ts',
    openclaw: 'src/openclaw.ts',
    bin: 'src/bin.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  banner: ({ format }) => {
    if (format === 'cjs') {
      return {
        js: '#!/usr/bin/env node',
      };
    }
    return {};
  },
});
