import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

/**
 * Brand email shell (PRD 9.6): dark header band with the serif wordmark, bone body, quiet footer.
 * Marketing emails pass `marketing` to add CASL sender identification, address and unsubscribe.
 */
export const colors = {
  ink950: '#0C0B0A',
  ink900: '#141311',
  bone50: '#F4EFE7',
  bone200: '#E4DCCF',
  bone700: '#5F584E',
  champagne600: '#A8874C',
  champagne800: '#7A5F2E',
}

export const serif = "'Instrument Serif', Georgia, 'Times New Roman', serif"
export const sans = "Manrope, 'Helvetica Neue', Arial, sans-serif"

export interface EmailShellProps {
  preview: string
  children: ReactNode
  siteUrl: string
  businessAddress: string
  legalName: string
  /** GST/HST registration number, printed on receipts when set (PRD 7.6). */
  gstHstNumber?: string
  marketing?: { unsubscribeUrl: string }
}

export function EmailShell({
  preview,
  children,
  siteUrl,
  businessAddress,
  legalName,
  gstHstNumber,
  marketing,
}: EmailShellProps) {
  return (
    <Html lang="en-CA">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: colors.bone200, margin: 0, padding: '24px 0', fontFamily: sans }}
      >
        <Container style={{ maxWidth: 600, backgroundColor: colors.bone50 }}>
          <Section style={{ backgroundColor: colors.ink950, padding: '28px 32px' }}>
            <Link
              href={siteUrl}
              style={{
                color: colors.bone50,
                textDecoration: 'none',
                fontFamily: serif,
                fontSize: 26,
                lineHeight: '30px',
              }}
            >
              Glint <em>&amp;</em> Thread
            </Link>
          </Section>
          <Section style={{ padding: '36px 32px 8px', color: colors.ink950 }}>{children}</Section>
          <Section style={{ padding: '8px 32px 32px' }}>
            <Hr style={{ borderColor: '#D9D0C2', margin: '24px 0' }} />
            <Text style={{ fontSize: 12, lineHeight: '18px', color: colors.bone700, margin: 0 }}>
              All the glint. None of the gold loan.
              <br />
              {legalName}, operating as Glint &amp; Thread. {businessAddress}
              {gstHstNumber ? (
                <>
                  <br />
                  GST/HST no. {gstHstNumber}
                </>
              ) : null}
            </Text>
            {marketing ? (
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: '18px',
                  color: colors.bone700,
                  margin: '8px 0 0',
                }}
              >
                You are receiving this because you signed up at{' '}
                {siteUrl.replace(/^https?:\/\//, '')}.{' '}
                <Link
                  href={marketing.unsubscribeUrl}
                  style={{ color: colors.bone700, textDecoration: 'underline' }}
                >
                  Unsubscribe
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const h1 = {
  fontFamily: serif,
  fontSize: 36,
  lineHeight: '40px',
  fontWeight: 400,
  margin: '0 0 16px',
  color: colors.ink950,
}
export const p = { fontSize: 15, lineHeight: '24px', margin: '0 0 16px', color: colors.ink950 }
export const muted = { fontSize: 13, lineHeight: '20px', margin: 0, color: colors.bone700 }
export const eyebrow = {
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: colors.bone700,
  margin: '0 0 12px',
}
export const button = {
  display: 'inline-block',
  backgroundColor: colors.ink950,
  color: colors.bone50,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  padding: '16px 28px',
  borderRadius: 2,
}
