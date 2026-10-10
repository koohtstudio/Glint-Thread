import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

/**
 * Underline-style form fields (PRD 4.6): bottom border only, 48px tall, eyebrow label above,
 * inline error below linked by aria-describedby. `tone="light"` for bone sections.
 */
interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string | null
  tone?: 'dark' | 'light'
  children: ReactNode
  className?: string
  hideLabel?: boolean
}

function FieldShell({
  id,
  label,
  hint,
  error,
  tone = 'dark',
  children,
  className,
  hideLabel,
}: FieldShellProps) {
  return (
    <div className={cx('flex flex-col', className)}>
      <label htmlFor={id} className={cx('eyebrow mb-1', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p
          id={`${id}-hint`}
          className={cx(
            'mt-2 text-[13px] leading-snug',
            tone === 'light' ? 'text-bone-700' : 'text-bone-500',
          )}
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className={cx(
            'mt-2 text-[13px] leading-snug',
            tone === 'light' ? 'text-error-dark' : 'text-error',
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

const inputBase =
  'h-12 w-full rounded-none border-0 border-b bg-transparent px-0 text-base transition-[border-color] duration-200 focus:border-b-2 focus:border-champagne-400 focus-visible:outline-none'

function describedBy(id: string, hint?: string, error?: string | null) {
  return (
    [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string | null
  tone?: 'dark' | 'light'
  id?: string
  hideLabel?: boolean
  wrapperClassName?: string
}

export function Input({
  label,
  hint,
  error,
  tone = 'dark',
  id,
  hideLabel,
  wrapperClassName,
  className,
  ...rest
}: InputProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      tone={tone}
      hideLabel={hideLabel}
      className={wrapperClassName}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cx(
          inputBase,
          tone === 'light'
            ? 'border-ink-950/30 text-ink-950 placeholder:text-bone-700 focus:border-champagne-800'
            : 'border-line-strong text-bone-50',
          error && (tone === 'light' ? 'border-error-dark' : 'border-error'),
          className,
        )}
        {...rest}
      />
    </FieldShell>
  )
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string | null
  id?: string
}

export function Textarea({ label, hint, error, id, className, ...rest }: TextareaProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cx(
          'min-h-36 w-full resize-y rounded-none border-0 border-b border-line-strong bg-transparent px-0 py-3 text-base leading-relaxed focus:border-b-2 focus:border-champagne-400 focus-visible:outline-none',
          error && 'border-error',
          className,
        )}
        {...rest}
      />
    </FieldShell>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode
  error?: string | null
  tone?: 'dark' | 'light'
  id?: string
}

/** Square checkbox drawn with tokens; the native input stays for accessibility. Unchecked by default (CASL). */
export function Checkbox({ label, error, tone = 'dark', id, className, ...rest }: CheckboxProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="relative mt-[3px] inline-flex size-5 shrink-0">
          <input
            id={fieldId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cx(
              'peer size-5 cursor-pointer appearance-none rounded-xs border transition-colors',
              tone === 'light'
                ? 'border-ink-950/50 checked:border-ink-950 checked:bg-ink-950'
                : 'border-line-strong checked:border-bone-50 checked:bg-bone-50',
            )}
            {...rest}
          />
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={cx(
              'pointer-events-none absolute inset-0 hidden size-5 peer-checked:block',
              tone === 'light' ? 'text-bone-50' : 'text-ink-950',
            )}
          >
            <path d="M5 10.5l3.2 3L15 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <label htmlFor={fieldId} className="cursor-pointer text-[14px] leading-snug">
          {label}
        </label>
      </div>
      {error ? (
        <p
          id={`${fieldId}-error`}
          className={cx(
            'mt-2 pl-8 text-[13px]',
            tone === 'light' ? 'text-error-dark' : 'text-error',
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Hidden honeypot field for spam bots (PRD 13). Humans never see or fill it. */
export function Honeypot({ name = 'company' }: { name?: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Company
        <input type="text" name={name} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  hint?: string
  error?: string | null
  id?: string
  tone?: 'dark' | 'light'
  wrapperClassName?: string
}

/** Underline-style native select (keeps platform pickers on phones) with our label, chevron and error treatment. */
export function Select({
  label,
  options,
  placeholder,
  hint,
  error,
  id,
  tone = 'dark',
  wrapperClassName,
  className,
  ...rest
}: SelectProps) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      tone={tone}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          className={cx(
            inputBase,
            'cursor-pointer appearance-none pr-8',
            tone === 'light'
              ? 'border-ink-950/30 text-ink-950 focus:border-champagne-800'
              : 'border-line-strong text-bone-50 focus:border-champagne-400',
            error && (tone === 'light' ? 'border-error-dark' : 'border-error'),
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" className="bg-ink-900 text-bone-500">
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-900 text-bone-50">
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-bone-300"
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </FieldShell>
  )
}
