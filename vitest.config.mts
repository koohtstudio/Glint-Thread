import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${root}/` },
      { find: /^server-only$/, replacement: `${root}/test/server-only-stub.ts` },
    ],
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/pricing/engine.ts',
        'lib/pricing/tax.ts',
        'lib/format.ts',
        'lib/data/local.ts',
        'lib/data/derive.ts',
      ],
      reporter: ['text', 'html'],
      thresholds: {
        'lib/pricing/engine.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
        'lib/pricing/tax.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
      },
    },
  },
})
