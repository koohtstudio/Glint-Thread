import { monogram } from '@/lib/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** G&T monogram favicon (the ampersand in champagne italic). */
export default function Icon() {
  return monogram(64)
}
