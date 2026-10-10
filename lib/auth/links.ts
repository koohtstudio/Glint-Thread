import 'server-only'
import { adminAuth } from '@/lib/firebase/admin'
import { emailShell, sendEmail } from '@/lib/email/send'
import {
  AccountDeletedEmail,
  AccountSetupEmail,
  ResetPasswordEmail,
  SignInLinkEmail,
  VerifyEmailEmail,
} from '@/lib/email/templates/account'
import { absoluteUrl } from '@/lib/public-env'

/**
 * Verification, reset and sign-in links (PRD 9.9). They are generated with the Admin SDK and sent by us through
 * Resend, so no default Firebase emails go out. The one-time `oobCode` is moved onto our own /account/action page,
 * which completes the action with the client SDK.
 */
export type ActionKind = 'verify' | 'reset' | 'signIn'

/** Rebuilds a Firebase action link on our domain, keeping the parameters the client SDK needs (mode, oobCode, apiKey). */
export function toOurActionUrl(firebaseLink: string, extra: Record<string, string> = {}): string {
  const source = new URL(firebaseLink)
  const params = new URLSearchParams()
  for (const key of ['mode', 'oobCode', 'apiKey', 'lang']) {
    const v = source.searchParams.get(key)
    if (v) params.set(key, v)
  }
  for (const [k, v] of Object.entries(extra)) params.set(k, v)
  return `${absoluteUrl('/account/action')}?${params.toString()}`
}

export async function createActionLink(
  kind: ActionKind,
  email: string,
  next?: string,
): Promise<string> {
  const auth = adminAuth()
  const settings = { url: absoluteUrl('/account/sign-in'), handleCodeInApp: kind === 'signIn' }
  const raw =
    kind === 'verify'
      ? await auth.generateEmailVerificationLink(email, settings)
      : kind === 'reset'
        ? await auth.generatePasswordResetLink(email, settings)
        : await auth.generateSignInWithEmailLink(email, settings)
  // The sign-in link carries the email so completing it on the same device needs no prompt.
  return toOurActionUrl(raw, { ...(kind === 'signIn' ? { email } : {}), ...(next ? { next } : {}) })
}

export async function sendVerificationEmail(email: string) {
  const link = await createActionLink('verify', email)
  await sendEmail({
    to: email,
    subject: 'Confirm your email',
    react: VerifyEmailEmail({ link, shell: await emailShell() }),
  })
}

export async function sendPasswordResetEmail(email: string) {
  const link = await createActionLink('reset', email)
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    react: ResetPasswordEmail({ link, shell: await emailShell() }),
  })
}

export async function sendSignInLinkEmail(email: string, next?: string) {
  const link = await createActionLink('signIn', email, next)
  await sendEmail({
    to: email,
    subject: 'Your sign-in link',
    react: SignInLinkEmail({ link, shell: await emailShell() }),
  })
}

export async function sendAccountSetupEmail(email: string, orderNumber: string) {
  const link = await createActionLink('signIn', email, '/account/orders')
  await sendEmail({
    to: email,
    subject: 'Finish setting up your account',
    react: AccountSetupEmail({ link, orderNumber, shell: await emailShell() }),
  })
}

export async function sendAccountDeletedEmail(email: string) {
  await sendEmail({
    to: email,
    subject: 'Your account has been deleted',
    react: AccountDeletedEmail({ shell: await emailShell() }),
  })
}
