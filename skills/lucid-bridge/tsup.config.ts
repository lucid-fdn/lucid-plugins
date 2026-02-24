import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    mcp: 'src/mcp.ts',
    openclaw: 'src/openclaw.ts',
    bin: 'src/bin.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node22',
  outDir: 'dist',
  splitting: false,
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: '// Lucid Bridge — Cross-Platform Startup Ops MCP\n',
      };
    }
    return {};
  },
});
