'use client'

import type { Auth } from 'firebase/auth'
import { publicEnv } from '@/lib/public-env'

/**
 * Firebase client SDK, loaded lazily and only on auth pages (PRD 9.9): it signs people in and completes email
 * links; the server session cookie is the source of truth afterwards. Nothing is persisted in the browser by
 * the SDK (in-memory persistence), and it never touches the bag or any page outside /account.
 */
let authPromise: Promise<Auth> | null = null

export function getClientAuth(): Promise<Auth> {
  authPromise ??= (async () => {
    const { initializeApp, getApps } = await import('firebase/app')
    const {
      initializeAuth,
      inMemoryPersistence,
      browserPopupRedirectResolver,
      connectAuthEmulator,
      getAuth,
    } = await import('firebase/auth')
    const { apiKey, authDomain, projectId, appId, authEmulatorHost } = publicEnv.firebase
    const app = getApps()[0] ?? initializeApp({ apiKey, authDomain, projectId, appId })
    let auth: Auth
    try {
      auth = initializeAuth(app, {
        persistence: inMemoryPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      })
    } catch {
      auth = getAuth(app) // already initialised (hot reload)
    }
    if (authEmulatorHost && !(auth as Auth & { emulatorConfig?: unknown }).emulatorConfig)
      connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true })
    return auth
  })()
  return authPromise
}

/** Tells the server about a signed-in Firebase user so it can set the session cookie. Returns the API response. */
export async function createServerSession(
  idToken: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  return { ok: res.ok, status: res.status }
}

/** Maps Firebase Auth error codes to our messages keys. */
export function authErrorKind(
  error: unknown,
): 'credentials' | 'tooMany' | 'invalidLink' | 'weakPassword' | 'other' {
  const code = (error as { code?: string })?.code ?? ''
  if (
    [
      'auth/invalid-credential',
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
    ].includes(code)
  )
    return 'credentials'
  if (code === 'auth/too-many-requests') return 'tooMany'
  if (['auth/invalid-action-code', 'auth/expired-action-code'].includes(code)) return 'invalidLink'
  if (code === 'auth/weak-password') return 'weakPassword'
  return 'other'
}
