import 'server-only'
import { env } from '@/lib/env'

/**
 * Authorises /api/admin/* (PRD 9.8): the Studio sends the signed-in user's Sanity token; the server
 * verifies it against the Sanity API (`/users/me` on this project) and requires project membership.
 * There is no shared secret, so nothing sensitive ships in Studio code.
 */
export interface AdminUser {
  id: string
  email: string | null
  roles: string[]
}

type Fetch = typeof fetch

export async function verifySanityUser(
  token: string,
  projectId: string,
  apiVersion: string,
  fetchImpl: Fetch = fetch,
): Promise<AdminUser | null> {
  if (!token || !/^[\w.-]{20,}$/.test(token)) return null
  try {
    const res = await fetchImpl(`https://${projectId}.api.sanity.io/v${apiVersion}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const user = (await res.json()) as {
      id?: string
      email?: string
      role?: string
      roles?: { name: string }[]
      projectId?: string
    }
    const roles = [
      ...(user.roles ?? []).map((r) => r.name),
      ...(user.role ? [user.role] : []),
    ].filter(Boolean)
    // Project membership: a member of this project has at least one role on it; anonymous users have none.
    if (!user.id || roles.length === 0) return null
    return { id: user.id, email: user.email ?? null, roles }
  } catch {
    return null
  }
}

export async function authoriseAdmin(
  request: Request,
  fetchImpl: Fetch = fetch,
): Promise<{ ok: true; user: AdminUser } | { ok: false }> {
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim()
  if (!token || !env.NEXT_PUBLIC_SANITY_PROJECT_ID) return { ok: false }
  const user = await verifySanityUser(
    token,
    env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    env.NEXT_PUBLIC_SANITY_API_VERSION,
    fetchImpl,
  )
  // Viewers can look but not act.
  if (!user || user.roles.every((r) => r === 'viewer')) return { ok: false }
  return { ok: true, user }
}
