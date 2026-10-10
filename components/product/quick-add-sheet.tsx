'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuickAdd } from '@/lib/cart/quick-add'
import type { ProductCard } from '@/lib/data/types'
import { useCart } from '@/lib/cart/store'
import { snapshotFor } from '@/lib/cart/snapshot'
import { t } from '@/lib/i18n'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Price } from '@/components/ui/price'
import { MatImage } from './mat-image'
import { VariantSelector, defaultVariant } from './variant-selector'

/** Variant sheet opened by "Choose options" on cards with more than one variant. */
export function QuickAddSheet() {
  const product = useQuickAdd((s) => s.product)
  const close = useQuickAdd((s) => s.close)
  return (
    <Sheet
      open={Boolean(product)}
      onOpenChange={(o) => !o && close()}
      side="right"
      title={t('product.variantSheetTitle')}
    >
      {product ? <QuickAddBody key={product.slug} product={product} onDone={close} /> : null}
    </Sheet>
  )
}

function QuickAddBody({ product, onDone }: { product: ProductCard; onDone: () => void }) {
  const add = useCart((s) => s.add)
  const [sku, setSku] = useState<string>(() => defaultVariant(product.variants).sku)
  const variant = product.variants.find((v) => v.sku === sku) ?? product.variants[0]
  const image = variant.image ?? product.images[0]

  return (
    <div className="flex flex-col gap-8 p-5 sm:p-6">
      <div className="grid grid-cols-[96px_1fr] gap-4">
        {image ? <MatImage image={image} sizes="96px" inset="tight" /> : null}
        <div>
          <p className="text-[15px] leading-snug font-medium">{product.title}</p>
          <p className="mt-1 text-[14px] text-bone-300">
            <Price cents={variant.priceCents} compareAtCents={product.compareAtPriceCents} />
          </p>
          <Link
            href={`/products/${product.slug}`}
            onClick={onDone}
            className="link-anim mt-3 text-[13px] text-bone-300"
          >
            {t('product.fullDetails')}
          </Link>
        </div>
      </div>
      <VariantSelector
        idPrefix="quick"
        optionNames={product.optionNames}
        variants={product.variants}
        selectedSku={sku}
        onSelect={setSku}
      />
      <Button
        fullWidth
        disabled={!variant.available}
        onClick={() => {
          add(variant.sku, 1, snapshotFor(product, variant))
          onDone()
        }}
      >
        {variant.available ? t('product.addToBag') : t('product.soldOut')}
      </Button>
    </div>
  )
}
