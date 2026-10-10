'use client'

import { useId, useState } from 'react'
import { useCart } from '@/lib/cart/store'
import { t } from '@/lib/i18n'
import { cx } from '@/lib/cx'
import { PlusIcon } from '@/components/ui/icons'

/** Promo code field, collapsed by default ("Have a code?", PRD 6.4). First-order codes ask for an email. */
export function PromoCode() {
  const promoCode = useCart((s) => s.promoCode)
  const email = useCart((s) => s.email)
  const quote = useCart((s) => s.quote)
  const setPromo = useCart((s) => s.setPromo)
  const uid = useId()
  const [open, setOpen] = useState(Boolean(promoCode))
  const [code, setCode] = useState(promoCode ?? '')
  const [mail, setMail] = useState(email ?? '')

  const status = quote?.promoCode
  const codeMessage = quote?.messages.find((m) => m.code.startsWith('code_'))
  const needsEmail = Boolean(status?.requiresEmail && !status.applied)

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${uid}-promo-panel`}
        className="flex min-h-12 w-full items-center justify-between text-[14px] text-bone-300 hover:text-bone-50"
      >
        {t('bag.haveCode')}
        <PlusIcon
          size={16}
          className={cx('transition-transform duration-250 ease-gallery', open && 'rotate-45')}
        />
      </button>
      <div id={`${uid}-promo-panel`} hidden={!open} className="pb-4">
        <form
          className="flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            setPromo(code || null, mail || null)
          }}
        >
          <div className="flex-1">
            <label htmlFor={`${uid}-promo-code`} className="eyebrow">
              {t('bag.codeLabel')}
            </label>
            <input
              id={`${uid}-promo-code`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby={codeMessage ? `${uid}-promo-message` : undefined}
              className="h-11 w-full border-b border-line-strong bg-transparent text-[15px] tracking-[0.06em] uppercase outline-offset-4 focus:border-champagne-400"
            />
          </div>
          {promoCode && status?.applied ? (
            <button
              type="button"
              onClick={() => {
                setPromo(null)
                setCode('')
              }}
              className="btn-label h-11 px-1 text-bone-300 hover:text-bone-50"
            >
              {t('bag.codeRemove')}
            </button>
          ) : (
            <button
              type="submit"
              className="btn-label h-11 border border-bone-50 px-4 hover:bg-bone-50/8"
            >
              {t('bag.codeApply')}
            </button>
          )}
        </form>
        {needsEmail || (email && status?.requiresEmail) ? (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault()
              setPromo(code || promoCode, mail || null)
            }}
          >
            <label htmlFor={`${uid}-promo-email`} className="eyebrow">
              {t('bag.codeEmailLabel')}
            </label>
            <div className="flex items-end gap-3">
              <input
                id={`${uid}-promo-email`}
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                autoComplete="email"
                aria-describedby={`${uid}-promo-email-hint`}
                className="h-11 w-full border-b border-line-strong bg-transparent text-[15px] outline-offset-4 focus:border-champagne-400"
              />
              <button
                type="submit"
                className="btn-label h-11 border border-bone-50 px-4 hover:bg-bone-50/8"
              >
                {t('bag.codeApply')}
              </button>
            </div>
            <p id={`${uid}-promo-email-hint`} className="mt-2 text-[13px] text-bone-500">
              {t('bag.codeEmailHint')}
            </p>
          </form>
        ) : null}
        {codeMessage && promoCode ? (
          <p
            id={`${uid}-promo-message`}
            role="status"
            className={cx(
              'mt-3 text-[13px]',
              codeMessage.type === 'error'
                ? 'text-error'
                : codeMessage.code === 'code_applied'
                  ? 'text-success'
                  : 'text-bone-300',
            )}
          >
            {codeMessage.text}
          </p>
        ) : null}
      </div>
    </div>
  )
}
