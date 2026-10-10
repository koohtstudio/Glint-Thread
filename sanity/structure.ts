import type { StructureResolver } from 'sanity/structure'
import { apiVersion } from './env'

/**
 * Desk structure (PRD 9.4, 10): singletons pinned first, a Needs attention list for launch prep,
 * and an Orders section with Needs review / To ship / Shipped / All.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Glint & Thread')
    .items([
      S.listItem()
        .title('Home page')
        .id('homePage')

        .child(S.document().schemaType('homePage').documentId('homePage').title('Home page')),
      S.listItem()
        .title('Site settings')
        .id('siteSettings')

        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings'),
        ),
      S.divider(),
      S.listItem()
        .title('Orders')
        .id('orders')

        .child(
          S.list()
            .title('Orders')
            .items([
              S.listItem()
                .title('Needs review')
                .id('orders-review')
                .child(
                  S.documentList()
                    .title('Needs review')
                    .apiVersion(apiVersion)
                    .filter('_type == "order" && needsReview == true')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('To ship')
                .id('orders-to-ship')
                .child(
                  S.documentList()
                    .title('To ship')
                    .apiVersion(apiVersion)
                    .filter('_type == "order" && status == "paid"')
                    .defaultOrdering([{ field: 'paidAt', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Shipped')
                .id('orders-shipped')
                .child(
                  S.documentList()
                    .title('Shipped')
                    .apiVersion(apiVersion)
                    .filter('_type == "order" && status in ["shipped", "delivered"]')
                    .defaultOrdering([{ field: 'shippedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('All orders')
                .id('orders-all')
                .child(
                  S.documentList()
                    .title('All orders')
                    .apiVersion(apiVersion)
                    .filter('_type == "order"')
                    .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
                ),
            ]),
        ),
      S.listItem()
        .title('Needs attention')
        .id('needs-attention')

        .child(
          S.documentList()
            .title('Products needing attention')
            .apiVersion(apiVersion)
            .filter(
              '_type == "product" && (count(verify) > 0 || defined(photoNote) || count(variants[!defined(stock)]) > 0)',
            ),
        ),
      S.divider(),
      S.documentTypeListItem('product').title('Products'),
      S.documentTypeListItem('department').title('Departments'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('collection').title('Collections'),
      S.divider(),
      S.documentTypeListItem('promotion').title('Promotions'),
      S.documentTypeListItem('promoCode').title('Promo codes'),
      S.divider(),
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('careGuide').title('Care guides'),
    ])
