import { Button, Section, Text } from '@react-email/components'
import { EmailShell, button, eyebrow, h1, muted, p, type EmailShellProps } from './layout'

type Shell = Omit<EmailShellProps, 'preview' | 'children'>

function LinkButton({ href, children }: { href: string; children: string }) {
  return (
    <Section style={{ margin: '8px 0 24px' }}>
      <Button href={href} style={button}>
        {children}
      </Button>
    </Section>
  )
}

/** Account emails (PRD 9.6.6): generated with the Firebase Admin SDK, sent by us, branded. Links open /account/action. */
export function VerifyEmailEmail({ link, shell }: { link: string; shell: Shell }) {
  return (
    <EmailShell preview="Confirm your email address" {...shell}>
      <Text style={eyebrow}>Your account</Text>
      <Text style={h1}>Confirm your email.</Text>
      <Text style={p}>
        One click and your Glint &amp; Thread account is ready, and any past orders made with this
        address will appear in it.
      </Text>
      <LinkButton href={link}>Confirm my email</LinkButton>
      <Text style={muted}>
        If you didn&apos;t create an account, ignore this email and nothing happens.
      </Text>
    </EmailShell>
  )
}

export function ResetPasswordEmail({ link, shell }: { link: string; shell: Shell }) {
  return (
    <EmailShell preview="Reset your password" {...shell}>
      <Text style={eyebrow}>Your account</Text>
      <Text style={h1}>Choose a new password.</Text>
      <Text style={p}>
        Use the button below to set a new password. The link works once and expires within the hour.
      </Text>
      <LinkButton href={link}>Reset my password</LinkButton>
      <Text style={muted}>
        If you didn&apos;t ask for this, you can ignore it. Your password stays as it is.
      </Text>
    </EmailShell>
  )
}

export function SignInLinkEmail({ link, shell }: { link: string; shell: Shell }) {
  return (
    <EmailShell preview="Your sign-in link" {...shell}>
      <Text style={eyebrow}>Your account</Text>
      <Text style={h1}>Your sign-in link.</Text>
      <Text style={p}>
        Open this on the device where you want to be signed in. No password needed. The link works
        once.
      </Text>
      <LinkButton href={link}>Sign in</LinkButton>
      <Text style={muted}>If you didn&apos;t ask for this, ignore this email.</Text>
    </EmailShell>
  )
}

/** Sent after payment to guests who ticked "Create an account" at checkout. */
export function AccountSetupEmail({
  link,
  orderNumber,
  shell,
}: {
  link: string
  orderNumber: string
  shell: Shell
}) {
  return (
    <EmailShell preview="Finish setting up your account" {...shell}>
      <Text style={eyebrow}>Order {orderNumber}</Text>
      <Text style={h1}>Finish setting up your account.</Text>
      <Text style={p}>
        Thanks for your order. Use the button below to sign in to your new account and see order{' '}
        {orderNumber}, its tracking and your saved details in one place. You can add a password from
        your profile.
      </Text>
      <LinkButton href={link}>Open my account</LinkButton>
      <Text style={muted}>
        The link works once. If you didn&apos;t ask for an account, ignore this email and we&apos;ll
        delete it.
      </Text>
    </EmailShell>
  )
}

export function AccountDeletedEmail({ shell }: { shell: Shell }) {
  return (
    <EmailShell preview="Your account has been deleted" {...shell}>
      <Text style={eyebrow}>Your account</Text>
      <Text style={h1}>Your account is deleted.</Text>
      <Text style={p}>
        We removed your profile, saved addresses, bag and newsletter subscription. Order records are
        kept without your name, email or address, because tax law requires us to keep sales records.
      </Text>
      <Text style={muted}>If this wasn&apos;t you, reply to this email right away.</Text>
    </EmailShell>
  )
}
