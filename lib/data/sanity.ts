import 'server-only'
import type { DataAdapter } from './types'

// Replaced by the full GROQ adapter in milestone M8.
export function createSanityAdapter(): DataAdapter {
  throw new Error('Sanity adapter not implemented yet')
}
