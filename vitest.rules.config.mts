import { defineConfig } from 'vitest/config'

/** Firestore security rules tests. Run through the emulator: `npm run test:rules`. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/rules/**/*.rules-test.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
