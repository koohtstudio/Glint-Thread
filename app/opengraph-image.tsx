import { getHomePage } from '@/lib/data'
import { OG_SIZE, brandCard } from '@/lib/og'

export const alt = 'Glint & Thread: All the glint. None of the gold loan.'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const home = await getHomePage()
  return brandCard({ imageSrc: home.hero.image.src })
}
