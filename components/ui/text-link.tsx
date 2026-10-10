import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { children: ReactNode }

/** Standalone call-to-action link: 1px underline, 4px offset, redraws 0 to 100% on hover (PRD 4.6). */
export function TextLink({ className, children, ...rest }: Props) {
  return (
    <Link {...rest} className={cx('link-cta btn-label', className)}>
      <span>{children}</span>
    </Link>
  )
}

/** Navigation-style link whose underline grows in on hover and stays for the current page. */
export function NavLink({ className, children, ...rest }: Props) {
  return (
    <Link {...rest} className={cx('link-anim', className)}>
      {children}
    </Link>
  )
}
