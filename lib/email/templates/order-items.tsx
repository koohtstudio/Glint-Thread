import { Column, Img, Row, Section, Text } from '@react-email/components'
import { formatMoney } from '@/lib/format'
import { colors, muted } from './layout'

export interface EmailLine {
  title: string
  variantTitle: string
  qty: number
  lineTotalCents: number
  imageUrl?: string | null
}

export function OrderItems({ lines }: { lines: EmailLine[] }) {
  return (
    <Section style={{ borderTop: `1px solid #D9D0C2` }}>
      {lines.map((l, i) => (
        <Row key={i} style={{ borderBottom: '1px solid #D9D0C2' }}>
          <Column style={{ width: 72, padding: '12px 0' }}>
            {l.imageUrl ? (
              <Img
                src={l.imageUrl}
                alt=""
                width={56}
                height={70}
                style={{ backgroundColor: '#1B1916', objectFit: 'contain', padding: 4 }}
              />
            ) : null}
          </Column>
          <Column style={{ padding: '12px 8px' }}>
            <Text style={{ fontSize: 14, lineHeight: '20px', margin: 0, color: colors.ink950 }}>
              {l.title}
            </Text>
            <Text style={muted}>
              {l.variantTitle !== 'Default' ? `${l.variantTitle} · ` : ''}Qty {l.qty}
            </Text>
          </Column>
          <Column style={{ width: 90, textAlign: 'right', padding: '12px 0' }}>
            <Text style={{ fontSize: 14, margin: 0, color: colors.ink950 }}>
              {formatMoney(l.lineTotalCents)}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}

export function Totals({ rows }: { rows: { label: string; value: string; strong?: boolean }[] }) {
  return (
    <Section style={{ marginTop: 16 }}>
      {rows.map((r) => (
        <Row key={r.label}>
          <Column>
            <Text
              style={{
                fontSize: r.strong ? 15 : 14,
                margin: '4px 0',
                color: r.strong ? colors.ink950 : colors.bone700,
              }}
            >
              {r.label}
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: r.strong ? 15 : 14, margin: '4px 0', color: colors.ink950 }}>
              {r.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}
