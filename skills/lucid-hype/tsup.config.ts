import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/mcp.ts', 'src/openclaw.ts', 'src/bin.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      };
    }
    return {};
  },
});
