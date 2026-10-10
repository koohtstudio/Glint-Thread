'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { BagContents, type BagConfig } from './bag-contents'

/** Full-page bag (fallback for the drawer). Shows a quiet toast when Stripe Checkout was cancelled (PRD 6.4.7). */
export function BagPageClient({ config }: { config: BagConfig }) {
  const params = useSearchParams()
  const shown = useRef(false)
  useEffect(() => {
    if (params.get('checkout') === 'cancelled' && !shown.current) {
      shown.current = true
      toast(t('bag.cancelled'))
    }
  }, [params])
  return <BagContents config={config} layout="page" />
}
