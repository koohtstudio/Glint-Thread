import { z } from 'zod'
import { emailShell, sendEmail } from '@/lib/email/send'
import { NewsletterConfirmEmail } from '@/lib/email/templates/emails'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'
import { signToken } from '@/lib/tokens'
import { upsertPendingSubscriber } from '@/lib/subscribers'
import { absoluteUrl } from '@/lib/public-env'
import { t } from '@/lib/i18n'

const schema = z.object({
  email: z.email().max(254),
  consent: z.literal(true),
  source: z.string().max(40).default('site'),
  company: z.string().max(0).optional().or(z.literal('')), // honeypot: must stay empty
})

/** Newsletter sign-up with CASL express consent and double opt-in (PRD 9.7). */
export async function POST(request: Request) {
  const rl = limiters.newsletter.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const body = await request.json().catch(() => null)
  if (body && typeof body.company === 'string' && body.company.length > 0) {
    // Honeypot tripped: pretend success so bots learn nothing.
    return Response.json({ ok: true })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some((i) => i.path[0] === 'consent')
    return Response.json(
      {
        error: consentMissing ? 'consent_required' : 'invalid_email',
        message: consentMissing ? t('newsletter.consentRequired') : t('forms.invalidEmail'),
      },
      { status: 400 },
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  await upsertPendingSubscriber({
    email,
    consentText: t('newsletter.consent'),
    source: parsed.data.source,
  })
  const confirmUrl = absoluteUrl(
    `/newsletter/confirm?email=${encodeURIComponent(email)}&token=${signToken('confirm', email)}`,
  )
  const unsubscribeUrl = absoluteUrl(
    `/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${signToken('unsubscribe', email)}`,
  )
  await sendEmail({
    to: email,
    subject: 'Confirm your email for 10% off',
    react: NewsletterConfirmEmail({
      confirmUrl,
      shell: { ...(await emailShell()), marketing: { unsubscribeUrl } },
    }),
  })
  return Response.json({ ok: true })
}
