export interface RouteIndex {
  products: string[]
  collections: string[]
  shop: Record<string, string[]>
  pages: string[]
}

/** True when a pathname is a page that exists (pure; used by proxy.ts and tests). */
export function isKnownPath(pathname: string, index: RouteIndex): boolean {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [root, a, b, ...rest] = parts
  if (root === 'products') return parts.length === 2 && index.products.includes(a)
  if (root === 'collections') return parts.length === 2 && index.collections.includes(a)
  if (root === 'shop') {
    if (rest.length) return false
    if (!a) return true
    if (!(a in index.shop)) return false
    return !b || index.shop[a].includes(b)
  }
  if (parts.length === 1) return index.pages.includes(root)
  return true
}
