import 'server-only'
import { render } from '@react-email/render'
import type { ReactElement } from 'react'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/data'

export interface SendArgs {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
  headers?: Record<string, string>
}

/**
 * Sends through Resend when RESEND_API_KEY is set; otherwise logs the plain-text email to the console
 * (PRD 8.4) so every flow can be exercised locally with zero accounts.
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  headers,
}: SendArgs): Promise<{ ok: boolean; id?: string; logged?: boolean }> {
  const text = await render(react, { plainText: true })
  if (!env.RESEND_API_KEY) {
    console.info(
      `\n[email:console] To: ${Array.isArray(to) ? to.join(', ') : to}\n[email:console] Subject: ${subject}${replyTo ? `\n[email:console] Reply-To: ${replyTo}` : ''}\n${text}\n[email:console] end\n`,
    )
    return { ok: true, logged: true }
  }
  const { Resend } = await import('resend')
  const resend = new Resend(env.RESEND_API_KEY)
  const html = await render(react)
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
    headers,
  })
  if (error) {
    console.error('[email] Resend error', error)
    return { ok: false }
  }
  return { ok: true, id: data?.id }
}

/** Shared shell props: site URL, legal name and address for CASL sender identification. */
export async function emailShell() {
  const settings = await getSiteSettings()
  return {
    siteUrl: env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
    legalName: settings.legalName,
    businessAddress: settings.businessAddress,
    ...(env.GST_HST_NUMBER ? { gstHstNumber: env.GST_HST_NUMBER } : {}),
  }
}
