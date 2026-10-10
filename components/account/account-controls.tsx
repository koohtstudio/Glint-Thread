'use client'

import { useState } from 'react'
import { hardNavigate } from '@/lib/auth/navigate'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'

/** Revokes the session on the server, then returns home with a full navigation so every page re-reads it. */
export function SignOutButton() {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      loading={busy}
      loadingLabel={t('account.signingOut')}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined)
        hardNavigate('/')
      }}
    >
      {t('account.signOut')}
    </Button>
  )
}

/** Shown while the email is unconfirmed: past orders and marketing consent wait for verification (PRD 9.9). */
export function VerifyBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <div
      role="status"
      className="mt-8 border border-line bg-ink-900 p-5 text-[15px] leading-relaxed"
    >
      <p>{t('auth.verifyBanner')}</p>
      {email ? <p className="mt-1 text-bone-300">{email}</p> : null}
      <button
        type="button"
        disabled={busy || sent}
        onClick={async () => {
          setBusy(true)
          const res = await fetch('/api/auth/resend-verification', { method: 'POST' }).catch(
            () => null,
          )
          setBusy(false)
          if (res?.ok) {
            setSent(true)
            toast(t('auth.verifyResent'))
          } else toast(t('account.saveError'), 'error')
        }}
        className="btn-label mt-4 min-h-11 underline underline-offset-4 disabled:text-bone-500 disabled:no-underline"
      >
        {sent ? t('auth.verifyResent') : t('auth.verifyResend')}
      </button>
    </div>
  )
}
