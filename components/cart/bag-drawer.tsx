'use client'

import { useCart, selectCount } from '@/lib/cart/store'
import { t } from '@/lib/i18n'
import { Sheet } from '@/components/ui/sheet'
import { BagContents, type BagConfig } from './bag-contents'

/** Bag drawer (PRD 4.6): right side, 440px on desktop, full width on mobile. */
export function BagDrawer({ config }: { config: BagConfig }) {
  const open = useCart((s) => s.isOpen)
  const setOpen = useCart((s) => s.setOpen)
  const count = useCart(selectCount)
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side="right"
      title={<span className="tabular">{t('bag.title', { count })}</span>}
    >
      <BagContents config={config} />
    </Sheet>
  )
}
