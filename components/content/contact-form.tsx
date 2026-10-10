'use client'

import { useState } from 'react'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Honeypot, Input, Textarea } from '@/components/ui/field'

/** Contact form (PRD 5.3): rate limited server-side, honeypot, inline errors. */
export function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', orderNumber: '', message: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values | 'form', string>>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')

  const set =
    (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }))

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const company = new FormData(e.currentTarget).get('company') ?? ''
    const next: typeof errors = {}
    if (!values.name.trim()) next.name = t('forms.required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = t('forms.invalidEmail')
    if (values.message.trim().length < 5) next.message = t('forms.required')
    setErrors(next)
    if (Object.keys(next).length) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company }),
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
      <p role="status" className="font-serif text-[28px] leading-tight">
        {t('contact.success')}
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="relative grid gap-8 sm:grid-cols-2">
      <Honeypot />
      <Input
        label={t('contact.name')}
        autoComplete="name"
        value={values.name}
        onChange={set('name')}
        error={errors.name}
        required
      />
      <Input
        label={t('contact.email')}
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        required
      />
      <Input
        label={t('contact.orderNumber')}
        wrapperClassName="sm:col-span-2"
        value={values.orderNumber}
        onChange={set('orderNumber')}
        autoCapitalize="characters"
      />
      <div className="sm:col-span-2">
        <Textarea
          label={t('contact.message')}
          value={values.message}
          onChange={set('message')}
          error={errors.message}
          required
          maxLength={4000}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" loading={status === 'sending'} loadingLabel={t('forms.sending')}>
          {t('contact.submit')}
        </Button>
        {errors.form ? (
          <p role="alert" className="mt-4 text-[13px] text-error">
            {errors.form}
          </p>
        ) : null}
      </div>
    </form>
  )
}
