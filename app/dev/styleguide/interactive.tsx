'use client'

import { useState } from 'react'
import type { ProductCard } from '@/lib/data/types'
import { toast } from '@/lib/toast'
import { Accordion } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Sheet } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/toaster'
import { VariantSelector, defaultVariant } from '@/components/product/variant-selector'

export function StyleguideInteractive({
  pyjamas,
  beret,
}: {
  pyjamas: ProductCard
  beret: ProductCard
}) {
  const [qty, setQty] = useState(2)
  const [sheet, setSheet] = useState<null | 'right' | 'left' | 'bottom'>(null)
  const [pjSku, setPjSku] = useState(defaultVariant(pyjamas.variants).sku)
  // Mark one beret colour sold out to show the struck chip state.
  const berets = beret.variants.map((v, i) => (i === 2 ? { ...v, available: false, stock: 0 } : v))
  const [beretSku, setBeretSku] = useState(berets[0].sku)

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div className="space-y-10">
        <VariantSelector
          idPrefix="sg-pj"
          optionNames={pyjamas.optionNames}
          variants={pyjamas.variants}
          selectedSku={pjSku}
          onSelect={setPjSku}
        />
        <VariantSelector
          idPrefix="sg-beret"
          optionNames={beret.optionNames}
          variants={berets}
          selectedSku={beretSku}
          onSelect={setBeretSku}
        />
        <div className="flex items-center gap-6">
          <QuantityStepper value={qty} onChange={setQty} />
          <QuantityStepper size="sm" value={1} onChange={() => {}} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => setSheet('right')}>
            Drawer right
          </Button>
          <Button variant="secondary" onClick={() => setSheet('left')}>
            Sheet left
          </Button>
          <Button variant="secondary" onClick={() => setSheet('bottom')}>
            Sheet bottom
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast('Golden Hour Textured Hoops added to your bag')}
          >
            Toast
          </Button>
        </div>
      </div>
      <Accordion
        defaultOpen={['details']}
        items={[
          {
            id: 'description',
            title: 'Description',
            content: <p>Big, glinting gold-tone hoops.</p>,
          },
          {
            id: 'details',
            title: 'Details',
            content: (
              <ul className="list-disc pl-5">
                <li>Gold-tone finish over base metal</li>
                <li>Hinged hoop closure</li>
              </ul>
            ),
          },
          { id: 'care', title: 'Care', content: <p>Keep them dry.</p> },
        ]}
      />
      {sheet ? (
        <Sheet
          open
          onOpenChange={(o) => !o && setSheet(null)}
          side={sheet}
          title={`Sheet (${sheet})`}
        >
          <p className="p-6 text-bone-300">
            Focus is trapped. Escape closes and focus returns to the trigger.
          </p>
        </Sheet>
      ) : null}
      <Toaster />
    </div>
  )
}
