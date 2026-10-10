import type { Metadata } from 'next'
import { features } from '@/lib/env'
import { pageMetadata } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { AccountsUnavailable, AuthShell } from '@/components/account/auth-shell'
import { ForgotPasswordForm } from '@/components/account/auth-forms'

export const metadata: Metadata = pageMetadata({
  title: t('auth.forgotTitle'),
  path: '/account/forgot-password',
  noindex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthShell title={t('auth.forgotTitle')} intro={t('auth.forgotIntro')}>
      {features.accounts ? <ForgotPasswordForm /> : <AccountsUnavailable />}
    </AuthShell>
  )
}
