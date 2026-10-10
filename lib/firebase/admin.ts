import 'server-only'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { env, features } from '@/lib/env'

/**
 * Firebase Admin SDK (server only, PRD 9.8). Uses the service account when configured; with the Firebase
 * emulators (FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST) it needs only a project ID.
 * firebase-admin is never imported from client code: the `server-only` import above enforces it.
 */
const APP_NAME = 'glint-and-thread'

export function firebaseConfigured(): boolean {
  return features.firebaseAdmin
}

function adminApp(): App {
  if (!features.firebaseAdmin)
    throw new Error('Firebase Admin is not configured (set the FIREBASE_ADMIN_* variables)')
  const existing = getApps().find((a) => a.name === APP_NAME)
  if (existing) return existing
  const projectId = env.FIREBASE_ADMIN_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const hasServiceAccount =
    env.FIREBASE_ADMIN_PROJECT_ID &&
    env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    env.FIREBASE_ADMIN_PRIVATE_KEY
  return initializeApp(
    {
      projectId,
      ...(hasServiceAccount
        ? {
            credential: cert({
              projectId: env.FIREBASE_ADMIN_PROJECT_ID,
              clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
              privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
            }),
          }
        : {}),
    },
    APP_NAME,
  )
}

export function adminAuth(): Auth {
  return getAuth(adminApp())
}

export function adminDb(): Firestore {
  const db = getFirestore(adminApp())
  const g = globalThis as { __gtFirestoreReady?: boolean }
  if (!g.__gtFirestoreReady) {
    g.__gtFirestoreReady = true
    try {
      // Optional fields are simply left out of documents. `settings()` may run once per Firestore instance, and
      // dev hot reloads or separately bundled routes can share it, hence the guard and the try.
      db.settings({ ignoreUndefinedProperties: true })
    } catch {
      /* already configured by another module instance */
    }
  }
  return db
}
