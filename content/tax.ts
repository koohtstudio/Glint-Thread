import catalog from '@/catalog/products.json'
import { buildTaxTable } from '@/lib/pricing/tax'

/** Seed tax table (2026 rates) from the catalogue's reference rates; editable in Sanity siteSettings. */
export const defaultTaxTable = buildTaxTable(catalog.tax.provinces)
