'use client'

import * as RadixAccordion from '@radix-ui/react-accordion'
import type { ReactNode } from 'react'
import { PlusIcon } from './icons'
import { cx } from '@/lib/cx'

export interface AccordionItemData {
  id: string
  title: string
  content: ReactNode
}

/** Hairline accordions (PRD 4.6): plus rotates 45 degrees, 250ms height animation. */
export function Accordion({
  items,
  defaultOpen,
  className,
}: {
  items: AccordionItemData[]
  defaultOpen?: string[]
  className?: string
}) {
  return (
    <RadixAccordion.Root
      type="multiple"
      defaultValue={defaultOpen}
      className={cx('border-t border-line', className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.id} value={item.id} className="border-b border-line">
          <RadixAccordion.Header asChild>
            <h3>
              <RadixAccordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium">
                {item.title}
                <PlusIcon
                  size={18}
                  className="shrink-0 text-bone-300 transition-transform duration-250 ease-gallery group-data-[state=open]:rotate-45"
                />
              </RadixAccordion.Trigger>
            </h3>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="accordion-content overflow-hidden">
            <div className="pb-6 text-[15px] leading-relaxed text-bone-300">{item.content}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  )
}
