import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** Minimal .env.local / .env loader for scripts (does not override variables already in the environment). */
export function loadEnvFiles(dir = process.cwd()) {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(dir, file)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#\n]*)"?\s*(#.*)?$/)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
    }
  }
}
