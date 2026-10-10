/**
 * A QA server with the hermetic test environment (e2e/test-env.ts), on its own build output:
 *
 *   npm run emulators                 # Firebase Auth + Firestore emulators, in another terminal
 *   npm run qa:server                 # next dev on :3300
 *   npm run qa:server -- start        # next build + next start on :3100 (what Playwright uses)
 */
import { spawn } from 'node:child_process'
import { testEnv } from '../e2e/test-env'

const mode = process.argv[2] === 'start' ? 'start' : 'dev'
const port = mode === 'start' ? 3100 : 3300
const env = {
  ...process.env,
  ...testEnv,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  ...(mode === 'dev' ? { NEXT_DIST_DIR: '.next-qa' } : {}),
}
const run = (args: string[]) =>
  new Promise<number>((resolve) =>
    spawn('npx', ['next', ...args], { stdio: 'inherit', env }).on('exit', (code) => resolve(code ?? 1)),
  )

async function main() {
  if (mode === 'start') {
    const built = await run(['build'])
    if (built !== 0) process.exit(built)
    process.exit(await run(['start', '--port', String(port)]))
  }
  process.exit(await run(['dev', '--port', String(port)]))
}

void main()
