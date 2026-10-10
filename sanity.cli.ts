import { defineCliConfig } from 'sanity/cli'

/** Sanity CLI (schema extract, TypeGen, deploy). Reads the same env vars as the app. */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not-configured',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
  typegen: {
    path: ['./lib/data/queries.ts', './sanity/**/*.{ts,tsx}'],
    schema: './sanity/extract.json',
    generates: './sanity.types.ts',
  },
})
