import { Button, Link, Section, Text } from '@react-email/components'
import { formatMoney } from '@/lib/format'
import { EmailShell, button, eyebrow, h1, muted, p, type EmailShellProps } from './layout'
import { OrderItems, Totals, type EmailLine } from './order-items'

type Shell = Omit<EmailShellProps, 'preview' | 'children'>

export interface OrderEmailData {
  orderNumber: string
  customerName?: string | null
  lines: EmailLine[]
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  shippingMethod?: string | null
  eta?: string | null
  address?: string[] | null
}

/** 1. Order confirmation (PRD 9.6). */
export function OrderConfirmationEmail({ order, shell }: { order: OrderEmailData; shell: Shell }) {
  return (
    <EmailShell preview={`Order ${order.orderNumber} is confirmed`} {...shell}>
      <Text style={eyebrow}>Order {order.orderNumber}</Text>
      <Text style={h1}>It&apos;s on its way soon.</Text>
      <Text style={p}>
        {order.customerName ? `Thank you, ${order.customerName.split(' ')[0]}. ` : 'Thank you. '}
        We pack every order within 1 to 2 business days and email you tracking as soon as it ships.
      </Text>
      <OrderItems lines={order.lines} />
      <Totals
        rows={[
          { label: 'Subtotal', value: formatMoney(order.subtotalCents) },
          ...(order.discountCents
            ? [{ label: 'Savings', value: `−${formatMoney(order.discountCents)}` }]
            : []),
          {
            label: order.shippingMethod ?? 'Shipping',
            value: order.shippingCents ? formatMoney(order.shippingCents) : 'Free',
          },
          ...(order.taxCents ? [{ label: 'Tax', value: formatMoney(order.taxCents) }] : []),
          { label: 'Total', value: formatMoney(order.totalCents), strong: true },
        ]}
      />
      {order.address?.length ? (
        <Section style={{ marginTop: 24 }}>
          <Text style={eyebrow}>Shipping to</Text>
          <Text style={p}>
            {order.address.map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </Text>
          {order.eta ? (
            <Text style={muted}>Estimated delivery: {order.eta} after it ships.</Text>
          ) : null}
        </Section>
      ) : null}
      <Text style={{ ...p, marginTop: 24 }}>
        Questions? Reply to this email or visit{' '}
        <Link href={`${shell.siteUrl}/contact`} style={{ color: '#7A5F2E' }}>
          our contact page
        </Link>
        .
      </Text>
    </EmailShell>
  )
}

/** 2. Shipping notification. */
export function ShippingEmail({
  orderNumber,
  carrier,
  trackingNumber,
  trackingUrl,
  lines,
  shell,
}: {
  orderNumber: string
  carrier: string
  trackingNumber: string
  trackingUrl: string
  lines: EmailLine[]
  shell: Shell
}) {
  return (
    <EmailShell preview={`Order ${orderNumber} has shipped`} {...shell}>
      <Text style={eyebrow}>Order {orderNumber}</Text>
      <Text style={h1}>Packed, sealed, on its way.</Text>
      <Text style={p}>
        Your order shipped with {carrier}. Tracking number: {trackingNumber}.
      </Text>
      <Section style={{ margin: '8px 0 24px' }}>
        <Button href={trackingUrl} style={button}>
          Track your parcel
        </Button>
      </Section>
      <OrderItems lines={lines} />
      <Text style={{ ...muted, marginTop: 16 }}>
        Something not right when it arrives? Email us within 7 days with a photo and we will fix it.
      </Text>
    </EmailShell>
  )
}

/** 3. Owner alert for a new paid order: plain and scannable. */
export function OwnerOrderEmail({
  orderNumber,
  totalCents,
  customer,
  lines,
  studioUrl,
  needsReview,
  shell,
}: {
  orderNumber: string
  totalCents: number
  customer: string
  lines: EmailLine[]
  studioUrl: string
  needsReview: boolean
  shell: Shell
}) {
  return (
    <EmailShell preview={`New order ${orderNumber}: ${formatMoney(totalCents)}`} {...shell}>
      <Text style={h1}>New order {orderNumber}</Text>
      {needsReview ? (
        <Text style={{ ...p, color: '#6E2A2F' }}>
          Needs review: stock went below zero on at least one variant.
        </Text>
      ) : null}
      <Text style={p}>
        {formatMoney(totalCents)} from {customer}.
      </Text>
      <OrderItems lines={lines} />
      <Section style={{ marginTop: 24 }}>
        <Button href={studioUrl} style={button}>
          Open in Studio
        </Button>
      </Section>
    </EmailShell>
  )
}

/** 4. Contact form message to the owner (reply-to is the customer). */
export function ContactEmail({
  name,
  email,
  orderNumber,
  message,
  shell,
}: {
  name: string
  email: string
  orderNumber?: string | null
  message: string
  shell: Shell
}) {
  return (
    <EmailShell preview={`Message from ${name}`} {...shell}>
      <Text style={eyebrow}>Contact form</Text>
      <Text style={h1}>Message from {name}</Text>
      <Text style={muted}>
        {email}
        {orderNumber ? ` · Order ${orderNumber}` : ''}
      </Text>
      <Text style={{ ...p, whiteSpace: 'pre-wrap', marginTop: 16 }}>{message}</Text>
      <Text style={muted}>Reply to this email to answer them directly.</Text>
    </EmailShell>
  )
}

/** 5a. Newsletter double opt-in confirmation. */
export function NewsletterConfirmEmail({
  confirmUrl,
  shell,
}: {
  confirmUrl: string
  shell: Shell & { marketing: { unsubscribeUrl: string } }
}) {
  return (
    <EmailShell preview="One click and you're in" {...shell}>
      <Text style={h1}>One click and you&apos;re in.</Text>
      <Text style={p}>
        Confirm your email to get ten percent off your first order and first dibs on small-batch
        drops. If you didn&apos;t sign up, ignore this email and nothing happens.
      </Text>
      <Section style={{ margin: '8px 0 24px' }}>
        <Button href={confirmUrl} style={button}>
          Confirm my email
        </Button>
      </Section>
    </EmailShell>
  )
}

/** 5b. Newsletter welcome with the WELCOME10 code. */
export function NewsletterWelcomeEmail({
  code,
  shell,
}: {
  code: string
  shell: Shell & { marketing: { unsubscribeUrl: string } }
}) {
  return (
    <EmailShell preview={`Your code: ${code}`} {...shell}>
      <Text style={eyebrow}>Welcome</Text>
      <Text style={h1}>Ten percent off, as promised.</Text>
      <Text style={p}>
        Enter this code under &quot;Have a code?&quot; in your bag. It works once, on your first
        order, after any automatic offers.
      </Text>
      <Text
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 40,
          letterSpacing: '0.06em',
          margin: '8px 0 24px',
        }}
      >
        {code}
      </Text>
      <Section style={{ margin: '0 0 16px' }}>
        <Button href={`${shell.siteUrl}/shop/jewellery`} style={button}>
          Shop jewellery
        </Button>
      </Section>
      <Text style={p}>
        We email when there&apos;s something worth opening. Usually a new small batch, sometimes an
        offer, never a flood.
      </Text>
    </EmailShell>
  )
}
