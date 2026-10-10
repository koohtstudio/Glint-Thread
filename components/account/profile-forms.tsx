'use client'

import { useState, type FormEvent } from 'react'
import { passwordSchema } from '@/lib/account/schemas'
import { hardNavigate } from '@/lib/auth/navigate'
import { t } from '@/lib/i18n'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Checkbox, Input } from '@/components/ui/field'

type Errors = Record<string, string>

/** Sensitive actions need a recent sign-in; the API answers 403 `reauth_required` and we send the customer back. */
function reauth(next: string) {
  hardNavigate(`/account/sign-in?reauth=1&next=${encodeURIComponent(next)}`)
}

async function send(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  const data = (await res?.json().catch(() => ({}))) as {
    error?: string
    message?: string
    fields?: Errors
  }
  return { ok: Boolean(res?.ok), status: res?.status ?? 0, data }
}

export function ProfileForm({
  email,
  initial,
}: {
  email: string
  initial: { firstName: string; lastName: string; phone: string }
}) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    const res = await send('/api/account/profile', 'PATCH', values)
    setBusy(false)
    if (res.ok) toast(t('account.profileSaved'))
    else if (res.data.fields) setErrors(res.data.fields)
    else toast(t('account.saveError'), 'error')
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-7">
      <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2">
        <Input
          label={t('account.firstName')}
          autoComplete="given-name"
          value={values.firstName}
          onChange={set('firstName')}
          error={errors.firstName}
          required
        />
        <Input
          label={t('account.lastName')}
          autoComplete="family-name"
          value={values.lastName}
          onChange={set('lastName')}
          error={errors.lastName}
          required
        />
      </div>
      <Input
        label={t('account.phone')}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={set('phone')}
        error={errors.phone}
      />
      <Input
        label={t('account.emailReadonly')}
        hint={t('account.emailReadonlyHint')}
        value={email}
        readOnly
        aria-readonly="true"
        className="text-bone-300"
      />
      <Button
        type="submit"
        loading={busy}
        loadingLabel={t('account.saving')}
        className="self-start"
      >
        {t('account.saveProfile')}
      </Button>
    </form>
  )
}

export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success)
      return setError(parsed.error.issues[0]?.message ?? t('validation.password'))
    setError(null)
    setBusy(true)
    const res = await send('/api/account/password', 'POST', { password })
    setBusy(false)
    if (res.ok) {
      setPassword('')
      toast(t('account.passwordSaved'))
    } else if (res.data.error === 'reauth_required') reauth('/account/profile')
    else setError(res.data.message ?? t('account.saveError'))
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-7">
      <Input
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint')}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
        required
      />
      <Button
        type="submit"
        loading={busy}
        loadingLabel={t('account.saving')}
        className="self-start"
      >
        {t('account.passwordSave')}
      </Button>
    </form>
  )
}

/** Delete my account (PIPEDA): type DELETE to confirm; needs a recent sign-in. */
export function DeleteAccountForm() {
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (confirm !== 'DELETE') return setError(t('account.deleteConfirmError'))
    setError(null)
    setBusy(true)
    const res = await send('/api/account/delete', 'POST', { confirm })
    if (res.ok) {
      hardNavigate('/?account=deleted')
      return
    }
    setBusy(false)
    if (res.data.error === 'reauth_required') reauth('/account/profile')
    else setError(res.data.message ?? t('account.saveError'))
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-xl flex-col gap-7">
      <Input
        label={t('account.deleteConfirmLabel')}
        autoComplete="off"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={error}
        data-testid="delete-confirm"
      />
      <Button
        type="submit"
        variant="secondary"
        loading={busy}
        loadingLabel={t('account.deleting')}
        className="self-start"
        data-testid="delete-account"
      >
        {t('account.deleteButton')}
      </Button>
    </form>
  )
}

/** Marketing email consent (CASL): unchecked by default, recorded when ticked, synced to Resend once verified. */
export function PreferencesForm({
  initial,
  emailVerified,
}: {
  initial: boolean
  emailVerified: boolean
}) {
  const [optIn, setOptIn] = useState(initial)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const change = async (next: boolean) => {
    setBusy(true)
    setNote(null)
    const res = await send('/api/account/preferences', 'POST', { marketingOptIn: next })
    setBusy(false)
    if (!res.ok) return toast(t('account.saveError'), 'error')
    setOptIn(next)
    setNote(
      next
        ? emailVerified
          ? t('account.marketingSaved')
          : t('account.marketingPending')
        : t('account.marketingOff'),
    )
  }

  return (
    <div className="max-w-xl">
      <Checkbox
        checked={optIn}
        disabled={busy}
        onChange={(e) => void change(e.target.checked)}
        data-testid="marketing-opt-in"
        label={
          <>
            {t('account.marketingLabel')}
            <span className="mt-1 block text-[13px] text-bone-500">
              {t('account.marketingHint')}
            </span>
          </>
        }
      />
      {note ? (
        <p role="status" className="mt-4 text-[14px] text-bone-300">
          {note}
        </p>
      ) : null}
    </div>
  )
}
