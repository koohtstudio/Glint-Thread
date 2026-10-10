import { Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { useCallback, useState } from 'react'
import { useClient, useFormValue, type StringInputProps } from 'sanity'
import { apiVersion } from '../env'

interface Customer {
  name: string | null
  email: string | null
  phone: string | null
  address: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
  stripeUrl: string | null
}

/**
 * Customer panel on the order form (PRD 9.4, 9.8). Personal details are never stored in Sanity:
 * they are fetched live from Stripe through /api/admin/order-customer, authorised with the
 * signed-in user's Sanity token, and held only in this component's memory.
 */
export function CustomerPanel(props: StringInputProps) {
  const client = useClient({ apiVersion })
  const orderId = useFormValue(['_id']) as string | undefined
  const sessionId = useFormValue(['stripe', 'checkoutSessionId']) as string | undefined
  const paymentIntentId = useFormValue(['stripe', 'paymentIntentId']) as string | undefined
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)

  const load = useCallback(async () => {
    if (!orderId) return
    setState('loading')
    setError(null)
    try {
      const token = client.config().token
      const res = await fetch('/api/admin/order-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: orderId.replace(/^drafts\./, '') }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      setCustomer(data.customer)
      setState('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the customer')
      setState('error')
    }
  }, [client, orderId])

  if (!sessionId) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text size={1} muted>
          No Stripe checkout yet. Customer details appear here once the order is paid.
        </Text>
      </Card>
    )
  }

  const a = customer?.address
  // Session IDs start cs_test_ or cs_live_, which tells us which Stripe dashboard to open.
  const dashboard = `https://dashboard.stripe.com${sessionId.startsWith('cs_live_') ? '' : '/test'}`
  const stripeUrl =
    customer?.stripeUrl ??
    (paymentIntentId
      ? `${dashboard}/payments/${paymentIntentId}`
      : `${dashboard}/checkout/sessions/${sessionId}`)
  return (
    <Card padding={4} radius={2} border>
      <Stack gap={3}>
        {customer ? (
          <>
            <Text size={2} weight="semibold">
              {customer.name ?? 'No name'}
            </Text>
            <Text size={1}>{customer.email ?? 'No email'}</Text>
            {customer.phone ? <Text size={1}>{customer.phone}</Text> : null}
            {a ? (
              <Text size={1}>
                {[
                  a.line1,
                  a.line2,
                  [a.city, a.state, a.postal_code].filter(Boolean).join(' '),
                  a.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            ) : null}
          </>
        ) : (
          <Text size={1} muted>
            Name, email, phone and address are kept in Stripe, not in the Studio.
          </Text>
        )}
        {error ? (
          <Text size={1} style={{ color: '#D07A6E' }}>
            {error}
          </Text>
        ) : null}
        <Flex gap={2} wrap="wrap">
          <Button
            text={customer ? 'Reload from Stripe' : 'Show customer'}
            mode="ghost"
            onClick={load}
            disabled={state === 'loading'}
          />
          <Button
            as="a"
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            text="Open in Stripe"
            mode="ghost"
            tone="primary"
          />
        </Flex>
        {/* The underlying field is never written: this keeps the form value empty on purpose. */}
        <span hidden>{props.value}</span>
      </Stack>
    </Card>
  )
}
