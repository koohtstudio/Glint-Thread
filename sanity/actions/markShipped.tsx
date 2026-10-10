import { Button, Select, Stack, Text, TextInput } from '@sanity/ui'
import { useState } from 'react'
import { useClient, type DocumentActionComponent } from 'sanity'
import { apiVersion } from '../env'

const CARRIERS = ['Canada Post', 'Purolator', 'UPS', 'FedEx']

/**
 * "Mark as shipped" (PRD 9.4): asks for carrier (default Canada Post) and tracking number, then calls
 * /api/admin/ship-order, which updates the order and emails the customer a tracking link.
 * Authorised with the signed-in user's Sanity token (verified server-side) so no secret ships to the browser.
 */
export const MarkShippedAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion })
  const doc = (props.draft ?? props.published) as {
    status?: string
    carrier?: string
    trackingNumber?: string
  } | null
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState(doc?.carrier ?? 'Canada Post')
  const [tracking, setTracking] = useState(doc?.trackingNumber ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (props.type !== 'order') return null
  const status = doc?.status
  const canShip = status === 'paid' || status === 'shipped'

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const token = client.config().token
      const res = await fetch('/api/admin/ship-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId: props.id, carrier, trackingNumber: tracking.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      setOpen(false)
      props.onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
    setBusy(false)
  }

  return {
    label: status === 'shipped' ? 'Update tracking' : 'Mark as shipped',
    tone: 'positive',
    disabled: !canShip,
    title: canShip ? undefined : 'Only paid orders can be shipped',
    onHandle: () => setOpen(true),
    dialog: open
      ? {
          type: 'dialog',
          header: 'Mark as shipped',
          onClose: () => setOpen(false),
          content: (
            <Stack gap={4}>
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  Carrier
                </Text>
                <Select value={carrier} onChange={(e) => setCarrier(e.currentTarget.value)}>
                  {CARRIERS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Stack>
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  Tracking number
                </Text>
                <TextInput
                  value={tracking}
                  onChange={(e) => setTracking(e.currentTarget.value)}
                  placeholder="e.g. 1234567890123456"
                />
              </Stack>
              <Text size={1} muted>
                The customer gets an email with the tracking link.
              </Text>
              {error ? (
                <Text size={1} style={{ color: '#D07A6E' }}>
                  {error}
                </Text>
              ) : null}
              <Button
                text={busy ? 'Saving' : 'Mark as shipped'}
                tone="positive"
                disabled={busy || tracking.trim().length < 4}
                onClick={submit}
              />
            </Stack>
          ),
        }
      : null,
  }
}
