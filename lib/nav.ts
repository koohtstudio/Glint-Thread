import type { Category, Department } from '@/lib/data/types'

export interface NavDepartment {
  slug: string
  title: string
  href: string
  productCount: number
  categories: { slug: string; title: string; href: string; productCount: number }[]
  tile: {
    src: string
    alt: string
    width: number
    height: number
    blurDataURL?: string
    line: string
  } | null
}

export interface Nav {
  primary: NavDepartment[]
  more: NavDepartment[]
  all: NavDepartment[]
  gifts: { label: string; href: string }
}

/** PRD 5.4: Jewellery, Hair, Bags, Hats & Scarves, Socks, More (the rest), plus Gifts. */
export const PRIMARY_DEPARTMENTS = ['jewellery', 'hair', 'bags', 'hats-scarves', 'socks']

export function buildNav(departments: Department[], categories: Category[]): Nav {
  const all: NavDepartment[] = departments.map((d) => ({
    slug: d.slug,
    title: d.title,
    href: `/shop/${d.slug}`,
    productCount: d.productCount,
    categories: categories
      .filter((c) => c.departmentSlug === d.slug && c.productCount > 0)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        slug: c.slug,
        title: c.title,
        href: `/shop/${d.slug}/${c.slug}`,
        productCount: c.productCount,
      })),
    tile: d.editorialTile
      ? {
          src: d.editorialTile.image.src,
          alt: d.editorialTile.image.alt,
          width: d.editorialTile.image.width,
          height: d.editorialTile.image.height,
          blurDataURL: d.editorialTile.image.blurDataURL,
          line: d.editorialTile.line,
        }
      : null,
  }))
  return {
    all,
    primary: all.filter((d) => PRIMARY_DEPARTMENTS.includes(d.slug)),
    more: all.filter((d) => !PRIMARY_DEPARTMENTS.includes(d.slug)),
    gifts: { label: 'Gifts', href: '/collections/gift-shop' },
  }
}
