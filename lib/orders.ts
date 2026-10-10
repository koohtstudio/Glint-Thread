import 'server-only'
import { features } from '@/lib/env'

/**
 * Order persistence helpers. Orders live in Sanity (PRD 9.2 to 9.4); without a write token the
 * store still quotes and shows checkout as "opening soon".
 */
export async function findCodeRedemptions(
  email: string,
): Promise<{ code: string; email: string }[]> {
  if (!features.sanity) return []
  const { sanityReadClient } = await import('@/sanity/lib/server-client')
  const rows = await sanityReadClient().fetch<{ code: string | null; email: string }[]>(
    `*[_type == "order" && status in ["paid","shipped","delivered"] && lower(customer.email) == $email && defined(promoCode)]{ "code": promoCode, "email": customer.email }`,
    { email: email.toLowerCase() },
  )
  return rows.filter((r): r is { code: string; email: string } => Boolean(r.code))
}
