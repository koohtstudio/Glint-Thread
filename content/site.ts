/**
 * Default site settings (seed source for the Sanity `siteSettings` singleton).
 * Owner facts are `[[PLACEHOLDER]]` markers; `npm run check:launch` fails while any remain.
 */
export const siteDefaults = {
  storeName: 'Glint & Thread',
  legalName: '[[LEGAL_NAME]]',
  businessAddress: '[[BUSINESS_ADDRESS]]',
  contactEmail: '[[CONTACT_EMAIL]]',
  pickupAddress: null as string | null,
  lowStockThreshold: 3,
  returnsSummary: [
    'We ship across Canada only. Orders leave within 1 to 2 business days.',
    'Standard tracked shipping is $8.99, free on orders over $60 after discounts. Expedited is $15.99.',
    'Return unworn items in their original packaging within 30 days of delivery. Refunds go to the original payment method once we receive the item.',
    'Final sale for hygiene reasons: earrings and ear cuffs, the Mystery Trio, hair ties and beauty tools.',
    'Damaged or wrong item? Email us within 7 days with a photo and we fix it at our cost.',
  ],
  social: [] as { label: string; href: string }[],
  seo: {
    title: 'Glint & Thread: fashion jewellery and accessories, shipped across Canada',
    description:
      'Gold-tone jewellery and everyday accessories, chosen in small batches and shipped across Canada. Free shipping on orders $60+.',
  },
  footerSignOff: 'All the glint. None of the gold loan.',
}
