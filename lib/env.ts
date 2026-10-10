import 'server-only'
import { parseEnv } from './env.core'

/** Validated server environment. Import only from server code. */
export const env = parseEnv(process.env)
export const features = env.features
