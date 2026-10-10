'use client'

import { useState } from 'react'
import { t } from '@/lib/i18n'
import { cx } from '@/lib/cx'
import { Button } from '@/components/ui/button'
import { Checkbox, Honeypot, Input } from '@/components/ui/field'

/**
 * Newsletter sign-up with CASL express consent (PRD 9.7): email plus an unchecked consent box.
 * Double opt-in: the code arrives after the confirm link is clicked.
 */
export function NewsletterForm({
  tone = 'dark',
  source = 'footer',
  compact = false,
}: {
  tone?: 'dark' | 'light'
  source?: string
  compact?: boolean
}) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; consent?: string; form?: string }>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const id = `nl-${source}`

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const next: typeof errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('forms.invalidEmail')
    if (!consent) next.consent = t('newsletter.consentRequired')
    setErrors(next)
    if (Object.keys(next).length) return
    setStatus('sending')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source, company: form.get('company') ?? '' }),
      })
      if (res.status === 429) throw new Error(t('forms.rateLimited'))
      if (!res.ok) throw new Error(t('forms.genericError'))
      setStatus('done')
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('forms.genericError') })
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <p
        role="status"
        className={cx(
          'text-[15px] leading-relaxed',
          tone === 'light' ? 'text-ink-950' : 'text-bone-50',
        )}
      >
        {t('newsletter.checkEmail')}
      </p>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="relative flex flex-col gap-5"
      aria-describedby={errors.form ? `${id}-form-error` : undefined}
    >
      <Honeypot />
      <div className={cx('flex gap-4', compact ? 'flex-col' : 'flex-col sm:flex-row sm:items-end')}>
        <Input
          id={`${id}-email`}
          type="email"
          name="email"
          autoComplete="email"
          label={t('newsletter.emailLabel')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          tone={tone}
          wrapperClassName="flex-1"
          required
        />
        <Button
          type="submit"
          variant={tone === 'light' ? 'primary-on-light' : 'secondary'}
          loading={status === 'sending'}
          loadingLabel={t('newsletter.submitting')}
          className={compact ? 'w-full' : 'sm:w-auto'}
        >
          {t('newsletter.submit')}
        </Button>
      </div>
      <Checkbox
        id={`${id}-consent`}
        name="consent"
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        label={t('newsletter.consent')}
        error={errors.consent}
        tone={tone}
      />
      {errors.form ? (
        <p
          id={`${id}-form-error`}
          role="alert"
          className={cx('text-[13px]', tone === 'light' ? 'text-error-dark' : 'text-error')}
        >
          {errors.form}
        </p>
      ) : null}
    </form>
  )
}
