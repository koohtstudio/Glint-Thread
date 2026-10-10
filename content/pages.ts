/**
 * Default content pages (PRD 6.6, 11, 12). Seed source for Sanity `page` documents and the local adapter.
 * Bodies use the small markdown dialect in lib/content/portable.ts.
 * Owner-specific facts are `[[PLACEHOLDER]]` markers; the launch check fails while any remain.
 */
export interface PageSeed {
  slug: string
  title: string
  eyebrow: string
  intro?: string
  body: string
  faqs?: { question: string; answer: string }[]
  seo?: { title?: string; description?: string }
}

export const pageSeeds: PageSeed[] = [
  {
    slug: 'about',
    title: 'Small batches, honestly made to shine.',
    eyebrow: 'Our story',
    intro:
      'Glint & Thread is a small Canadian shop for fashion jewellery and the accessories that sit around it.',
    body: `## Who we are

[[OWNER_STORY]]

## How we choose pieces

We buy in small batches, mostly from makers and wholesalers in Turkey, and we only bring in what we would wear ourselves. Every piece gets handled, photographed and checked before it is listed. If the clasp feels flimsy or the plating looks thin, it doesn't make the cut.

Small batches mean we can try things: a bow earring this month, a corduroy cap the next. It also means that when something sells out, it is usually gone for good.

## Our honesty promise

- We call things what they are. Gold-tone is gold-tone plating over base metal. Stainless steel is only called stainless steel when the packaging says so.
- No fake reviews, no invented ratings, no "12 people are looking at this".
- No fake sales. If you ever see a "was" price here, the item really sold at that price.
- Prices include everything except sales tax, and shipping is shown before you pay.

Our initials are G&T. Yes, we know.`,
    seo: { description: 'Who we are, how we choose pieces and our honesty promise.' },
  },
  {
    slug: 'shipping-returns',
    title: 'Shipping & returns',
    eyebrow: 'Help',
    intro: 'We ship across Canada only, by tracked Canada Post.',
    body: `## Shipping

- We ship across Canada only. Orders leave within 1 to 2 business days.
- Standard tracked shipping (Canada Post) is $8.99 and takes 3 to 7 business days.
- Standard shipping is free on orders over $60, after discounts.
- Expedited tracked shipping (Canada Post) is $15.99 and takes 2 to 4 business days.

You'll get an email with a tracking link as soon as your order ships.

## Returns

Return unworn items in their original packaging within 30 days of delivery. Once we receive the item, we refund the original payment method. Return shipping is paid by you unless the item arrived damaged or wrong.

To start a return, [contact us](/contact) with your order number and the items you'd like to send back.

## Final sale

For hygiene reasons, these can't be returned unless they arrive damaged or wrong:

- Earrings and ear cuffs
- The Mystery Trio
- Hair ties
- Beauty tools, including razors, sponges and curlers
- Anything marked final sale on its product page

## Damaged or wrong item

Email us within 7 days of delivery with a photo, and we fix it at our cost with a replacement or a refund.

> Questions about an order? [Check its status](/order-status) or [get in touch](/contact).`,
    seo: {
      description:
        'Shipping across Canada, free over $60. Returns within 30 days on eligible items.',
    },
  },
  {
    slug: 'faq',
    title: 'Questions, answered',
    eyebrow: 'FAQ',
    intro: 'The short version of everything people ask us. Still stuck? [Write to us](/contact).',
    body: '',
    faqs: [
      {
        question: 'Is your jewellery real gold?',
        answer:
          'No. Our pieces are gold-tone or silver-tone plating over base metal, unless the listing says stainless steel. That is why a pair of statement earrings costs $12.99, not $1,200. We label every piece honestly so you know exactly what you are buying.',
      },
      {
        question: 'Will it turn my skin green?',
        answer:
          'It can happen with plated jewellery, especially with moisture. Plating wears over time, and sweat, water, lotion and perfume speed that up. Keep pieces dry, put them on last and take them off first, and store them separately. Stainless steel pieces hold up best. See our [care guide](/care) for more.',
      },
      {
        question: 'Where do you ship?',
        answer: 'Across Canada only, for now. We do not ship to the United States or overseas yet.',
      },
      {
        question: 'How long does shipping take?',
        answer:
          'Orders leave within 1 to 2 business days. Standard tracked shipping takes 3 to 7 business days and expedited takes 2 to 4. Standard shipping is free on orders over $60 after discounts.',
      },
      {
        question: 'Can I return earrings?',
        answer:
          'Earrings and ear cuffs are final sale for hygiene reasons, along with hair ties and beauty tools. If they arrive damaged or wrong, email us within 7 days with a photo and we will make it right. Everything else can be returned unworn within 30 days.',
      },
      {
        question: 'Do you charge sales tax?',
        answer:
          '[[UPDATE IF REGISTERED]] Not at the moment. We are a small supplier under the federal $30,000 threshold, so we are not registered for GST/HST and do not charge it. If that changes, taxes will be calculated at checkout and shown before you pay.',
      },
      {
        question: 'How do I use WELCOME10?',
        answer:
          'Sign up for our newsletter and confirm your email, and we will send you WELCOME10. Enter it under "Have a code?" in your bag for 10 percent off your first order. It applies after automatic offers like the sock and earring deals, and works once per email.',
      },
      {
        question: 'Do you restock?',
        answer:
          'Sometimes, not always. We buy in small batches, so when a piece sells out it is usually gone. Popular pieces occasionally come back. Newsletter subscribers hear first.',
      },
      {
        question: 'How do the sock and earring offers work?',
        answer:
          'They apply automatically in your bag. Socks: any 3 or more ankle or crew pairs save 20 percent, 6 or more save 30 percent. Earrings: for every 3 eligible pairs, the lowest-priced one is free. The Mystery Trio is excluded because it is already discounted.',
      },
    ],
    seo: {
      description:
        'Real gold? Green skin? Shipping, returns, tax and WELCOME10, answered honestly.',
    },
  },
  {
    slug: 'contact',
    title: 'Get in touch',
    eyebrow: 'Contact',
    intro:
      'Questions about an order, a piece or a return? Send us a note. We reply within 1 to 2 business days.',
    body: `You can also email us directly at [[CONTACT_EMAIL]]. For a faster answer about an order, include your order number (it starts with GT-).

Mailing address: [[BUSINESS_ADDRESS]]`,
    seo: { description: 'Contact Glint & Thread about an order, a product or a return.' },
  },
  {
    slug: 'care',
    title: 'Care guide',
    eyebrow: 'Help',
    intro: 'A little care keeps the glint where it belongs. Find your piece below.',
    body: '',
    seo: { description: 'How to care for gold-tone jewellery, textiles, bags and beauty tools.' },
  },
  {
    slug: 'size-guide',
    title: 'Size guide',
    eyebrow: 'Help',
    intro: "Most of what we sell is one size. Where it isn't, here is how things fit.",
    body: `## Socks

Our ankle and crew socks fit women's shoe sizes 5 to 9 (EU 35 to 40). The active crew socks also come in a men's size that fits shoe sizes 8 to 11.

## Pyjamas and thermals

Our suede-touch pyjama sets come in S/M, L, XL and XXL. The fleece-lined thermal leggings come in S/M and L/XL. [[SIZE_CHART_MEASUREMENTS]]

If you are between sizes, size up for a relaxed fit.

## Hats

Berets, bucket hats and caps are one size, with adjustable backs on the baseball caps. The corduroy baker boy caps are a size M.

## Still unsure?

[Ask us](/contact) and we will measure the piece for you.`,
    seo: { description: 'How our socks, pyjamas, thermals and hats fit.' },
  },
  {
    slug: 'privacy',
    title: 'Privacy policy',
    eyebrow: 'Legal',
    intro:
      'What we collect, why, who helps us process it and how to reach us. Written to meet PIPEDA.',
    body: `This policy applies to [[LEGAL_NAME]], operating as Glint & Thread ("we", "us"). Last updated [[PRIVACY_UPDATED_DATE]].

## What we collect

- Order information: your name, email, phone number, shipping address, the items you bought and what you paid. Card details are handled by Stripe and never reach us.
- Contact messages: your name, email and what you write to us.
- Newsletter: your email, the consent wording you agreed to, and when.
- Basic site analytics: anonymous, cookieless page view counts through Vercel Analytics. No advertising trackers.

Your bag is saved in your own browser (local storage), not on our servers.

## Why we collect it

To process and ship your order, send order and shipping emails, answer your questions and, only if you opted in, send our newsletter.

## Who helps us

- Stripe (payments)
- Sanity (our order and content database)
- Resend (email delivery)
- Vercel (website hosting and cookieless analytics)
- Canada Post (delivery)

Some of these providers store data outside Canada, including in the United States, where it may be accessible to authorities under local law.

## How long we keep it

Order records are kept for 7 years for tax and accounting. Contact messages for 2 years. Newsletter records until you unsubscribe, plus the consent record as proof.

## Your rights

You can ask to see the personal information we hold about you, correct it, or withdraw consent for marketing at any time. Email [[CONTACT_EMAIL]] and we respond within 30 days. Every newsletter has a one-click unsubscribe link.

## Contact

Privacy questions: [[CONTACT_EMAIL]], [[BUSINESS_ADDRESS]]. If you are not satisfied with our answer, you can contact the Office of the Privacy Commissioner of Canada.`,
    seo: {
      description: 'How Glint & Thread collects, uses and protects your personal information.',
    },
  },
  {
    slug: 'terms',
    title: 'Terms of sale',
    eyebrow: 'Legal',
    intro: 'The plain-language terms for buying from Glint & Thread.',
    body: `These terms apply to purchases from [[LEGAL_NAME]], operating as Glint & Thread, [[BUSINESS_ADDRESS]]. Last updated [[TERMS_UPDATED_DATE]].

## Prices

All prices are in Canadian dollars and exclude sales tax. Any applicable tax and shipping are shown at checkout before you pay. We never add hidden fees.

## Product descriptions

We describe materials honestly. Gold-tone and silver-tone pieces are plated over base metal. Colours can look slightly different on different screens.

## Orders

Placing an order is an offer to buy. We confirm it by email once payment clears. If a piece sells out before we can ship it, we refund you in full and let you know.

## Shipping

We ship within Canada only. See [shipping & returns](/shipping-returns) for prices and times.

## Returns and final sale

Returns are accepted within 30 days for unworn items in original packaging. Hygiene items are final sale. Details are on the [shipping & returns](/shipping-returns) page.

## Promotions

Automatic offers and codes apply as described on the site at the time of purchase and can't be combined with cash. WELCOME10 is one use per email.

## Contact

[[CONTACT_EMAIL]]`,
    seo: { description: 'Terms of sale for Glint & Thread.' },
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    eyebrow: 'About',
    intro: 'We want everyone to be able to browse and buy from Glint & Thread comfortably.',
    body: `## Our target

This site aims to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.

## What we do

- Every page can be used with a keyboard, with a visible focus outline.
- Text meets AA contrast against its background.
- Product images have text alternatives, and colour options always have a text label.
- Menus, the bag and the image viewer work with screen readers and close with Escape.
- Motion is kept to a minimum and switches off when your device asks for reduced motion.

## Known limits

Some product photos are still being reshot and may show packaging. Product descriptions always carry the key details in text.

## Tell us

If anything gets in your way, [contact us](/contact) or email [[CONTACT_EMAIL]]. We will help you complete your order and fix the problem.`,
    seo: {
      description: 'Our accessibility target and how to reach us if something gets in your way.',
    },
  },
]
