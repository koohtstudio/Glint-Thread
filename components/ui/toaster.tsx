'use client'

import { useToasts } from '@/lib/toast'
import { CloseIcon } from './icons'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

/** Toasts (PRD 4.6): bottom-centre on mobile, bottom-right on desktop, 4s, announced politely. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:p-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 border border-line bg-ink-900 py-3 pr-2 pl-4 text-[14px] leading-snug',
            toast.tone === 'error' && 'text-error',
            toast.tone === 'success' && 'text-bone-50',
          )}
        >
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="flex size-11 shrink-0 items-center justify-center text-bone-500 hover:text-bone-50"
            aria-label={t('a11y.close')}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
