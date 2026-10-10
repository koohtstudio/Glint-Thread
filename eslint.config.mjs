import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    '.next-qa/**',
    '.next-e2e/**',
    '_smoke*.mjs',
    'public/fonts/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/catalog/**',
    '.generated/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'sanity.types.ts',
    'sanity/extract.json',
    'catalog/**',
  ]),
])

export default eslintConfig
