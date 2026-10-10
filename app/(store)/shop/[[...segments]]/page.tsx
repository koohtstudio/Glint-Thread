import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getCategories, getDepartment, getDepartments, getProductCards } from '@/lib/data'
import { computeFacets } from '@/lib/data/facets'
import { sortProducts } from '@/lib/data/derive'
import type { Category, Department, ProductCard } from '@/lib/data/types'
import { pageMetadata, type Crumb } from '@/lib/seo'
import { t } from '@/lib/i18n'
import { ListingHeader } from '@/components/listing/listing-header'
import { ListingStatic, ListingView } from '@/components/listing/listing-view'
import type { EditorialTile } from '@/components/listing/listing-grid'

/** /shop, /shop/[department], /shop/[department]/[category] (PRD 5.3). */
/** Every param is prerendered by generateStaticParams, so navigation may block on the cached page. */
export const instant = false

export async function generateStaticParams() {
  const [departments, categories] = await Promise.all([getDepartments(), getCategories()])
  return [
    { segments: [] },
    ...departments.map((d) => ({ segments: [d.slug] })),
    ...categories
      .filter((c) => c.productCount > 0)
      .map((c) => ({ segments: [c.departmentSlug, c.slug] })),
  ]
}

interface Resolved {
  department: Department | null
  category: Category | null
  products: ProductCard[]
  categories: Category[]
  departments: Department[]
}

async function resolve(segments: string[] = []): Promise<Resolved | null> {
  if (segments.length > 2) return null
  const [departments, categories, cards] = await Promise.all([
    getDepartments(),
    getCategories(),
    getProductCards(),
  ])
  const [deptSlug, catSlug] = segments
  const department = deptSlug ? ((await getDepartment(deptSlug)) ?? null) : null
  if (deptSlug && !department) return null
  const category = catSlug
    ? (categories.find((c) => c.slug === catSlug && c.departmentSlug === deptSlug) ?? null)
    : null
  if (catSlug && !category) return null
  const products = sortProducts(
    cards.filter(
      (p) =>
        (!department || p.departmentSlug === department.slug) &&
        (!category || p.categorySlug === category.slug),
    ),
    'featured',
  )
  return { department, category, products, categories, departments }
}

export async function generateMetadata({
  params,
}: PageProps<'/shop/[[...segments]]'>): Promise<Metadata> {
  const { segments } = await params
  const r = await resolve(segments)
  if (!r) return {}
  const path = `/shop${segments?.length ? `/${segments.join('/')}` : ''}`
  if (r.category && r.department)
    return pageMetadata({
      title: `${r.category.title}`,
      description: `${r.category.title} from our ${r.department.title.toLowerCase()} edit. ${r.department.blurb}`,
      path,
    })
  if (r.department)
    return pageMetadata({ title: r.department.title, description: r.department.blurb, path })
  return pageMetadata({
    title: t('nav.allProducts'),
    description:
      'Every piece in the shop: gold-tone jewellery, hair, bags, hats, socks and more, shipped across Canada.',
    path,
  })
}

export default async function ShopPage({ params }: PageProps<'/shop/[[...segments]]'>) {
  const { segments } = await params
  const r = await resolve(segments)
  if (!r) notFound()
  const { department, category, products, categories, departments } = r

  const crumbs: Crumb[] = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.shop'), href: '/shop' },
  ]
  if (department) crumbs.push({ name: department.title, href: `/shop/${department.slug}` })
  if (category && department)
    crumbs.push({ name: category.title, href: `/shop/${department.slug}/${category.slug}` })

  const facets = computeFacets(
    products,
    department && !category
      ? categories
          .filter((c) => c.departmentSlug === department.slug)
          .map((c) => ({ slug: c.slug, title: c.title }))
      : [],
  )
  const tileDepts = department ? [department] : departments
  const tiles: EditorialTile[] = tileDepts
    .filter((d) => d.editorialTile)
    .map((d) => ({
      image: d.editorialTile!.image,
      line: d.editorialTile!.line,
      href: department ? undefined : `/shop/${d.slug}`,
    }))

  const eyebrow = category ? department!.title : department ? t('nav.shop') : t('nav.shop')
  const title = category?.title ?? department?.title ?? t('nav.allProducts')
  const blurb =
    department?.blurb ??
    'Everything in the shop, in small batches. Gold-tone jewellery, hair, bags, hats, socks and the little extras.'

  return (
    <>
      <ListingHeader
        eyebrow={eyebrow}
        title={title}
        blurb={blurb}
        count={products.length}
        crumbs={crumbs}
      />
      <Suspense fallback={<ListingStatic products={products} facets={facets} tiles={tiles} />}>
        <ListingView products={products} facets={facets} tiles={tiles} />
      </Suspense>
    </>
  )
}
