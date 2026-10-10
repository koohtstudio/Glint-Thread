import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin'
import { publicEnv } from '@/lib/public-env'

export { safeNext } from './next'

/**
 * Firebase session cookies (PRD 9.9). The client SDK signs in; the server exchanges the ID token for a
 * session cookie (httpOnly, sameSite=lax, secure over https) and reads it in server components and route handlers.
 */
export const SESSION_COOKIE = 'gt_session'
/** Non-sensitive hint (no personal data) so the bag knows to sync without loading the Firebase SDK. */
export const HINT_COOKIE = 'gt_signed_in'
export const SESSION_MS = 5 * 24 * 60 * 60 * 1000
/** Password changes and account deletion need a sign-in within this many seconds. */
export const FRESH_LOGIN_SECONDS = 10 * 60

export interface SessionUser {
  uid: string
  email: string | null
  emailVerified: boolean
  /** Seconds since epoch of the last interactive sign-in. */
  authTime: number
}

const secure = () => publicEnv.siteUrl.startsWith('https://')

export async function createSession(
  idToken: string,
): Promise<{ cookie: string; user: SessionUser }> {
  const auth = adminAuth()
  const decoded = await auth.verifyIdToken(idToken, true)
  const cookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_MS })
  const record = await auth.getUser(decoded.uid)
  return {
    cookie,
    user: {
      uid: decoded.uid,
      email: record.email ?? null,
      emailVerified: record.emailVerified,
      authTime: decoded.auth_time,
    },
  }
}

export async function setSessionCookies(cookie: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: secure(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MS / 1000,
  })
  jar.set(HINT_COOKIE, '1', {
    httpOnly: false,
    secure: secure(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MS / 1000,
  })
}

export async function clearSessionCookies() {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: secure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  jar.set(HINT_COOKIE, '', {
    httpOnly: false,
    secure: secure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/** The signed-in customer, or null. Checks revocation and reads the live user record (email verification). */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!firebaseConfigured()) return null
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value
  if (!cookie) return null
  try {
    const auth = adminAuth()
    const decoded = await auth.verifySessionCookie(cookie, true)
    const record = await auth.getUser(decoded.uid)
    if (record.disabled) return null
    return {
      uid: decoded.uid,
      email: record.email ?? null,
      emailVerified: record.emailVerified,
      authTime: decoded.auth_time,
    }
  } catch {
    return null
  }
}

/** For account pages: redirects to sign-in (remembering where to come back to) when signed out. */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/account/sign-in?next=${encodeURIComponent(next)}`)
  return user
}

export function isFreshLogin(
  user: SessionUser,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return nowSeconds - user.authTime <= FRESH_LOGIN_SECONDS
}
