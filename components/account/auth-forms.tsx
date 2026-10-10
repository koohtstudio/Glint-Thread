'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { authErrorKind, createServerSession, getClientAuth } from '@/lib/firebase/client'
import { safeNext } from '@/lib/auth/next'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Checkbox, Honeypot, Input } from '@/components/ui/field'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Errors = Record<string, string>

function Notice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'error' | 'success'
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'text-[14px] leading-relaxed',
        tone === 'error' ? 'text-error' : tone === 'success' ? 'text-success' : 'text-bone-300',
      )}
    >
      {children}
    </p>
  )
}

function errorMessage(kind: ReturnType<typeof authErrorKind>): string {
  if (kind === 'credentials') return t('auth.badCredentials')
  if (kind === 'tooMany') return t('auth.tooMany')
  if (kind === 'invalidLink') return t('auth.actionInvalid')
  return t('auth.sessionFailed')
}

/** Exchange the signed-in client user for the server session cookie, then do a full navigation so server state is fresh. */
async function completeSignIn(user: { getIdToken: () => Promise<string> }, next: string) {
  const idToken = await user.getIdToken()
  const session = await createServerSession(idToken)
  if (!session.ok)
    throw Object.assign(new Error('session'), {
      code: session.status === 429 ? 'auth/too-many-requests' : 'session/failed',
    })
  window.location.assign(safeNext(next))
}

function Tab({
  active,
  onClick,
  children,
  id,
  controls,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  id: string
  controls: string
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cx(
        'btn-label h-12 border-b px-1 transition-colors',
        active
          ? 'border-bone-50 text-bone-50'
          : 'border-transparent text-bone-500 hover:text-bone-300',
      )}
    >
      {children}
    </button>
  )
}

/** Sign in: password, email link, and Google when the flag is on (PRD 9.9). */
export function SignInForm({ next, google }: { next: string; google: boolean }) {
  const [tab, setTab] = useState<'password' | 'link'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    const next_: Errors = {}
    if (!EMAIL_RE.test(email)) next_.email = t('forms.invalidEmail')
    if (!password) next_.password = t('validation.required')
    setErrors(next_)
    if (Object.keys(next_).length) return
    setBusy(true)
    try {
      const auth = await getClientAuth()
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      await completeSignIn(cred.user, next)
    } catch (err) {
      setErrors({ form: errorMessage(authErrorKind(err)) })
      setBusy(false)
    }
  }

  const submitLink = async (e: FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) return setErrors({ email: t('forms.invalidEmail') })
    setErrors({})
    setBusy(true)
    const res = await fetch('/api/auth/email-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, next }),
    }).catch(() => null)
    setBusy(false)
    if (res?.ok) setSent(true)
    else setErrors({ form: res?.status === 429 ? t('auth.tooMany') : t('forms.genericError') })
  }

  const withGoogle = async () => {
    setBusy(true)
    setErrors({})
    try {
      const auth = await getClientAuth()
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      await completeSignIn(cred.user, next)
    } catch (err) {
      const code = (err as { code?: string }).code
      setErrors(
        code === 'auth/popup-closed-by-user' ? {} : { form: errorMessage(authErrorKind(err)) },
      )
      setBusy(false)
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={t('auth.signInTitle')}
        className="flex gap-6 border-b border-line"
      >
        <Tab
          id="tab-password"
          controls="panel-password"
          active={tab === 'password'}
          onClick={() => setTab('password')}
        >
          {t('auth.tabPassword')}
        </Tab>
        <Tab
          id="tab-link"
          controls="panel-link"
          active={tab === 'link'}
          onClick={() => setTab('link')}
        >
          {t('auth.tabLink')}
        </Tab>
      </div>

      {tab === 'password' ? (
        <form
          id="panel-password"
          role="tabpanel"
          aria-labelledby="tab-password"
          onSubmit={submitPassword}
          noValidate
          className="mt-8 flex flex-col gap-7"
        >
          <Input
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label={t('auth.password')}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />
          {errors.form ? <Notice tone="error">{errors.form}</Notice> : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button type="submit" loading={busy} loadingLabel={t('auth.signingIn')}>
              {t('auth.signInButton')}
            </Button>
            <Link
              href="/account/forgot-password"
              className="link-anim text-[14px] text-bone-300 hover:text-bone-50"
            >
              {t('auth.forgot')}
            </Link>
          </div>
        </form>
      ) : (
        <form
          id="panel-link"
          role="tabpanel"
          aria-labelledby="tab-link"
          onSubmit={submitLink}
          noValidate
          className="mt-8 flex flex-col gap-7"
        >
          {sent ? (
            <Notice tone="success">{t('auth.emailLinkSent')}</Notice>
          ) : (
            <>
              <Input
                label={t('auth.email')}
                hint={t('auth.emailLinkHint')}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />
              {errors.form ? <Notice tone="error">{errors.form}</Notice> : null}
              <Button
                type="submit"
                loading={busy}
                loadingLabel={t('auth.signingIn')}
                className="self-start"
              >
                {t('auth.emailLinkButton')}
              </Button>
            </>
          )}
        </form>
      )}

      {google ? (
        <div className="mt-10">
          <p className="eyebrow mb-4 text-center">{t('auth.or')}</p>
          <Button type="button" variant="secondary" fullWidth onClick={withGoogle} disabled={busy}>
            {t('auth.google')}
          </Button>
        </div>
      ) : null}

      <p className="mt-12 border-t border-line pt-6 text-[14px] text-bone-300">
        {t('auth.newHere')}{' '}
        <Link
          href={`/account/sign-up${next && next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="prose-link text-bone-50"
        >
          {t('auth.createOne')}
        </Link>
      </p>
    </div>
  )
}

/** Sign up: the server creates the user and sends our verification email; then we sign in and open the account. */
export function SignUpForm({ next }: { next: string }) {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [marketing, setMarketing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const company = new FormData(e.currentTarget).get('company') ?? ''
    const local: Errors = {}
    if (!values.firstName.trim()) local.firstName = t('validation.firstName')
    if (!values.lastName.trim()) local.lastName = t('validation.lastName')
    if (!EMAIL_RE.test(values.email)) local.email = t('forms.invalidEmail')
    if (values.password.length < 10) local.password = t('validation.password')
    setErrors(local)
    if (Object.keys(local).length) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, marketingOptIn: marketing, company }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(
          data.fields ?? {
            form:
              res.status === 429 ? t('auth.tooMany') : (data.message ?? t('forms.genericError')),
          },
        )
        setBusy(false)
        return
      }
      const auth = await getClientAuth()
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const cred = await signInWithEmailAndPassword(auth, values.email.trim(), values.password)
      await completeSignIn(cred.user, next === '/account' ? '/account?welcome=1' : next)
    } catch (err) {
      setErrors({ form: errorMessage(authErrorKind(err)) })
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-7">
      <Honeypot />
      <div className="grid gap-7 sm:grid-cols-2">
        <Input
          label={t('auth.firstName')}
          autoComplete="given-name"
          value={values.firstName}
          onChange={set('firstName')}
          error={errors.firstName}
          required
        />
        <Input
          label={t('auth.lastName')}
          autoComplete="family-name"
          value={values.lastName}
          onChange={set('lastName')}
          error={errors.lastName}
          required
        />
      </div>
      <Input
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        required
      />
      <Input
        label={t('auth.password')}
        hint={t('auth.passwordHint')}
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={set('password')}
        error={errors.password}
        required
      />
      <Checkbox
        id="signup-marketing"
        checked={marketing}
        onChange={(e) => setMarketing(e.target.checked)}
        label={t('auth.marketing')}
      />
      {errors.form ? <Notice tone="error">{errors.form}</Notice> : null}
      <Button type="submit" loading={busy} loadingLabel={t('auth.creating')} className="self-start">
        {t('auth.signUpButton')}
      </Button>
      <p className="border-t border-line pt-6 text-[14px] text-bone-300">
        {t('auth.haveAccount')}{' '}
        <Link href="/account/sign-in" className="prose-link text-bone-50">
          {t('auth.signInInstead')}
        </Link>
      </p>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const company = new FormData(e.currentTarget).get('company') ?? ''
    if (!EMAIL_RE.test(email)) return setError(t('forms.invalidEmail'))
    setError(null)
    setBusy(true)
    const res = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, company }),
    }).catch(() => null)
    setBusy(false)
    if (res?.ok) setSent(true)
    else setError(res?.status === 429 ? t('auth.tooMany') : t('forms.genericError'))
  }

  if (sent) return <Notice tone="success">{t('auth.forgotSent')}</Notice>
  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-7">
      <Honeypot />
      <Input
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        required
      />
      <Button type="submit" loading={busy} loadingLabel={t('forms.sending')} className="self-start">
        {t('auth.forgotButton')}
      </Button>
      <p className="border-t border-line pt-6 text-[14px]">
        <Link href="/account/sign-in" className="prose-link text-bone-300 hover:text-bone-50">
          {t('auth.backToSignIn')}
        </Link>
      </p>
    </form>
  )
}

/**
 * Completes an emailed link (PRD 9.9): confirm email, choose a new password, or sign in with the link.
 * The links are generated on the server and point here, so users never see Firebase's pages.
 */
export function ActionHandler({
  mode,
  oobCode,
  email: emailParam,
  next,
}: {
  mode: string
  oobCode: string
  email: string
  next: string
}) {
  const [state, setState] = useState<
    'working' | 'verified' | 'reset-form' | 'reset-done' | 'need-email' | 'invalid' | 'failed'
  >(oobCode ? 'working' : 'invalid')
  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const started = useRef(false)

  const signInWithLink = async (address: string) => {
    setBusy(true)
    try {
      const auth = await getClientAuth()
      const { signInWithEmailLink } = await import('firebase/auth')
      const cred = await signInWithEmailLink(auth, address.trim(), window.location.href)
      await completeSignIn(cred.user, next)
    } catch (err) {
      setState(authErrorKind(err) === 'invalidLink' ? 'invalid' : 'failed')
      setBusy(false)
    }
  }

  useEffect(() => {
    if (started.current || !oobCode) return
    started.current = true
    void (async () => {
      try {
        const auth = await getClientAuth()
        const fb = await import('firebase/auth')
        if (mode === 'verifyEmail') {
          await fb.applyActionCode(auth, oobCode)
          setState('verified')
        } else if (mode === 'resetPassword') {
          await fb.verifyPasswordResetCode(auth, oobCode)
          setState('reset-form')
        } else if (mode === 'signIn') {
          if (emailParam) await signInWithLink(emailParam)
          else setState('need-email')
        } else setState('invalid')
      } catch (err) {
        setState(authErrorKind(err) === 'invalidLink' ? 'invalid' : 'failed')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    const local: Errors = {}
    if (password.length < 10) local.password = t('validation.password')
    if (confirm !== password) local.confirm = t('validation.passwordMatch')
    setErrors(local)
    if (Object.keys(local).length) return
    setBusy(true)
    try {
      const auth = await getClientAuth()
      const { confirmPasswordReset } = await import('firebase/auth')
      await confirmPasswordReset(auth, oobCode, password)
      setState('reset-done')
    } catch (err) {
      setErrors({
        form:
          authErrorKind(err) === 'invalidLink' ? t('auth.actionInvalid') : t('forms.genericError'),
      })
    }
    setBusy(false)
  }

  if (state === 'working') return <Notice>{t('auth.actionWorking')}</Notice>
  if (state === 'invalid' || state === 'failed')
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="error">
          {state === 'invalid' ? t('auth.actionInvalid') : t('forms.genericError')}
        </Notice>
        <Link href="/account/sign-in" className="link-cta btn-label self-start">
          <span>{t('auth.backToSignIn')}</span>
        </Link>
      </div>
    )
  if (state === 'verified')
    return (
      <div className="flex flex-col gap-6">
        <p className="font-serif text-[32px] leading-tight">{t('auth.actionVerified')}</p>
        <p className="text-bone-300">{t('auth.actionVerifiedBody')}</p>
        <Button asChild className="self-start">
          <Link href="/account/sign-in">{t('auth.signInButton')}</Link>
        </Button>
      </div>
    )
  if (state === 'reset-done')
    return (
      <div className="flex flex-col gap-6">
        <p className="font-serif text-[32px] leading-tight">{t('auth.resetDone')}</p>
        <Button asChild className="self-start">
          <Link href="/account/sign-in">{t('auth.signInButton')}</Link>
        </Button>
      </div>
    )
  if (state === 'need-email')
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (EMAIL_RE.test(email)) void signInWithLink(email)
          else setErrors({ email: t('forms.invalidEmail') })
        }}
        className="flex flex-col gap-7"
        noValidate
      >
        <Input
          label={t('auth.email')}
          hint={t('auth.linkEmailPrompt')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Button
          type="submit"
          loading={busy}
          loadingLabel={t('auth.signingIn')}
          className="self-start"
        >
          {t('auth.linkContinue')}
        </Button>
      </form>
    )
  return (
    <form onSubmit={savePassword} noValidate className="flex flex-col gap-7">
      <Input
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint')}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />
      <Input
        label={t('auth.confirmPassword')}
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
        required
      />
      {errors.form ? <Notice tone="error">{errors.form}</Notice> : null}
      <Button type="submit" loading={busy} loadingLabel={t('forms.sending')} className="self-start">
        {t('auth.resetButton')}
      </Button>
    </form>
  )
}
