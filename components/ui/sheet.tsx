'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { CloseIcon } from './icons'
import { cx } from '@/lib/cx'
import { t } from '@/lib/i18n'

type Side = 'right' | 'left' | 'bottom'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side?: Side
  title: ReactNode
  /** Visually hide the title (it is still announced). */
  hideTitle?: boolean
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Extra content in the header row, before the close button. */
  headerExtra?: ReactNode
  onCloseAutoFocus?: (e: Event) => void
}

const sideClasses: Record<Side, string> = {
  right: 'sheet-right inset-y-0 right-0 h-dvh w-full sm:w-[440px] sm:border-l sm:border-line',
  left: 'sheet-left inset-y-0 left-0 h-dvh w-full sm:w-[420px] sm:border-r sm:border-line',
  bottom: 'sheet-bottom inset-x-0 bottom-0 max-h-[88dvh] w-full border-t border-line',
}

/**
 * Drawer / sheet on Radix Dialog (PRD 4.6, 4.7): 350ms slide on the gallery ease, backdrop to ink-950/60,
 * focus trapped, Escape closes, focus returns to the trigger.
 */
export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  title,
  hideTitle,
  description,
  children,
  footer,
  className,
  headerExtra,
  onCloseAutoFocus,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-50 bg-ink-950/60" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          aria-describedby={description ? undefined : undefined}
          className={cx(
            'fixed z-50 flex flex-col bg-ink-900 text-bone-50 outline-none',
            sideClasses[side],
            className,
          )}
        >
          <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-5 sm:px-6">
            <Dialog.Title className={cx('text-[15px] font-medium', hideTitle && 'sr-only')}>
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description className="sr-only">{description}</Dialog.Description>
            ) : null}
            <div className="ml-auto flex items-center gap-2">
              {headerExtra}
              <Dialog.Close
                className="-mr-3 flex size-11 items-center justify-center text-bone-300 transition-colors hover:text-bone-50"
                aria-label={t('a11y.close')}
              >
                <CloseIcon />
              </Dialog.Close>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer ? <div className="shrink-0 border-t border-line">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
