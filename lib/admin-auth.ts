import 'server-only'
import { createClient } from '@sanity/client'
import { env } from '@/lib/env'
import { safeEqual } from '@/lib/tokens'

/**
 * Authorises admin actions (PRD 9.4). Accepts either ADMIN_ACTION_SECRET (scripts, automation) or
 * the signed-in Studio user's Sanity token, verified against the Sanity API and required to hold an
 * administrator or editor role. The secret itself never ships in the Studio's browser bundle.
 */
export async function authoriseAdmin(
  request: Request,
): Promise<{ ok: true; by: string } | { ok: false }> {
  const bearer = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()
  if (!bearer) return { ok: false }
  if (env.ADMIN_ACTION_SECRET && safeEqual(bearer, env.ADMIN_ACTION_SECRET))
    return { ok: true, by: 'secret' }
  if (!env.NEXT_PUBLIC_SANITY_PROJECT_ID) return { ok: false }
  try {
    const user = await createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
      token: bearer,
      useCdn: false,
    }).request<{ id?: string; email?: string; roles?: { name: string }[]; role?: string }>({
      uri: '/users/me',
    })
    const roles = [...(user.roles ?? []).map((r) => r.name), user.role].filter(Boolean)
    if (user.id && roles.some((r) => r === 'administrator' || r === 'editor'))
      return { ok: true, by: user.email ?? user.id }
  } catch {
    /* invalid token */
  }
  return { ok: false }
}
