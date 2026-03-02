import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  // Bundle all @raijinlabs/* skill packages into a single file.
  // @modelcontextprotocol/sdk remains external (peer dep).
  noExternal: [/@raijinlabs\/.*/],
  // Packages with native workers or heavy native bindings must stay external.
  external: ['jsdom', 'cheerio'],
  // Provide a real CJS `require` for bundled CJS packages (e.g. @notionhq/client).
  // Without this, tsup's ESM shim throws "Dynamic require of X is not supported".
  banner: {
    js: `import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);`,
  },
})
