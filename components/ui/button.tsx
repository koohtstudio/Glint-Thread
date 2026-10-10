import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'primary-on-light' | 'secondary-on-light' | 'quiet'
type Size = 'md' | 'sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Accessible text announced while loading (the visual is a thin animated line, PRD 4.6). */
  loadingLabel?: string
  asChild?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-bone-50 text-ink-950 hover:bg-champagne-400 disabled:bg-ink-700 disabled:text-bone-500 aria-disabled:bg-ink-700 aria-disabled:text-bone-500',
  secondary:
    'border border-bone-50 text-bone-50 hover:bg-bone-50/8 disabled:border-ink-700 disabled:text-bone-500 aria-disabled:border-ink-700 aria-disabled:text-bone-500',
  'primary-on-light':
    'bg-ink-950 text-bone-50 hover:bg-champagne-800 disabled:bg-bone-200 disabled:text-bone-700',
  'secondary-on-light': 'border border-ink-950 text-ink-950 hover:bg-ink-950/6',
  quiet: 'text-bone-300 hover:text-bone-50',
}

const sizes: Record<Size, string> = {
  md: 'h-12 px-7',
  sm: 'h-11 px-5',
}

/** Primary and secondary buttons (PRD 4.6). 2px radius, uppercase 13px label, translateY(1px) when pressed. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  asChild = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cx(
        'btn-label relative inline-flex items-center justify-center gap-2 rounded-xs whitespace-nowrap transition-[background-color,color,border-color] duration-300 ease-gallery select-none active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...(asChild ? {} : { type: rest.type ?? 'button' })}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className={cx('inline-flex items-center gap-2', loading && 'invisible')}>
            {children}
          </span>
          {loading ? (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="relative h-px w-12 overflow-hidden bg-current/25">
                <span className="absolute inset-0 animate-hairline bg-current" />
              </span>
            </span>
          ) : null}
          {loading && loadingLabel ? <span className="sr-only">{loadingLabel}</span> : null}
        </>
      )}
    </Comp>
  )
}
