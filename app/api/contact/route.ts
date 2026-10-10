import { z } from 'zod'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/data'
import { emailShell, sendEmail } from '@/lib/email/send'
import { ContactEmail } from '@/lib/email/templates/emails'
import { clientIp, limiters, tooManyRequests } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  orderNumber: z.string().trim().max(20).optional().or(z.literal('')),
  message: z.string().trim().min(5).max(4000),
  company: z.string().max(0).optional().or(z.literal('')),
})

/** Contact form to the owner, reply-to set to the customer (PRD 9.6.4). Rate limited with a honeypot. */
export async function POST(request: Request) {
  const rl = limiters.contact.check(clientIp(request.headers))
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)
  const body = await request.json().catch(() => null)
  if (body && typeof body.company === 'string' && body.company.length > 0)
    return Response.json({ ok: true })
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), true]))
    return Response.json({ error: 'invalid', fields }, { status: 400 })
  }
  const settings = await getSiteSettings()
  const to =
    env.OWNER_EMAIL ?? (settings.contactEmail.includes('[[') ? null : settings.contactEmail)
  const { name, email, orderNumber, message } = parsed.data
  await sendEmail({
    to: to ?? 'owner@example.ca',
    replyTo: email,
    subject: `Contact: ${name}${orderNumber ? ` (${orderNumber})` : ''}`,
    react: ContactEmail({ name, email, orderNumber, message, shell: await emailShell() }),
  })
  return Response.json({ ok: true })
}
