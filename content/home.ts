/**
 * Homepage defaults (PRD 6.1, core copy from PRD 3.3 verbatim). Seed source for the `homePage` singleton.
 */
export const homeDefaults = {
  announcements: [
    'Free shipping across Canada on orders $60+',
    'Socks: 3+ pairs save 20%',
    'Earrings: buy 2, get 1 free',
  ],
  hero: {
    eyebrow: 'Small-batch jewellery & accessories',
    headline: 'All the glint.',
    headlineItalic: 'None of the gold loan.',
    sub: 'Gold-tone jewellery and everyday accessories, chosen in small batches and shipped across Canada.',
    image: 'images/gold-ribbon-bow-drop-earrings-02.jpg',
    imageAlt: 'Gold-tone statement earrings on their gift cards, laid out on black',
    primaryCta: { label: 'Shop jewellery', href: '/shop/jewellery' },
    secondaryCta: { label: 'See the fall edit', href: '/collections/fall-edit' },
  },
  edit: { eyebrow: 'Featured', title: "This week's edit", productSlugs: [] as string[] },
  departmentMosaic: ['jewellery', 'hats-scarves', 'bags', 'hair', 'socks', 'charms'],
  departmentExtras: ['loungewear', 'beauty'],
  brandBand: {
    line: 'Small batches. Honest materials, honestly labelled. Shipped across Canada.',
    points: [
      {
        title: 'Small batches',
        body: 'We buy a few of each piece, not a warehouse of them. When something sells out, it is usually gone, and the next drop is something new.',
      },
      {
        title: 'Honest materials, honestly labelled',
        body: 'Gold-tone means gold-tone plating over base metal. Stainless steel means stainless steel. Prices reflect what things are, never what they pretend to be.',
      },
      {
        title: 'Shipped across Canada',
        body: 'Every order leaves within 1 to 2 business days by tracked Canada Post. Free standard shipping on orders over $60.',
      },
    ],
  },
  spotlight: {
    eyebrow: 'Collection',
    collectionSlug: 'fall-edit',
    title: 'Sweater weather',
    body: 'Corduroy baker boy caps with a chain trim, berets in six colours and blanket scarves big enough to hide in. Dressed for the walk, not the weather report.',
    image: 'images/corduroy-baker-boy-cap-01.jpg',
    imageAlt:
      'Six corduroy baker boy caps in olive, cream, burgundy, camel, toffee and blush taupe',
  },
  offers: [
    {
      eyebrow: 'Socks',
      title: 'Mix & match socks.',
      titleItalic: '3+ pairs save 20%.',
      body: 'Any ankle or crew socks count, in any combination. Six or more pairs save 30%. Applied in your bag automatically.',
      link: { label: 'Shop socks', href: '/shop/socks' },
    },
    {
      eyebrow: 'Earrings',
      title: 'Earrings.',
      titleItalic: 'Buy 2, get 1 free.',
      body: 'For every three pairs, the lowest-priced pair is on us. Mix hoops, studs and drops. The Mystery Trio is already a deal, so it sits this one out.',
      link: { label: 'Shop earrings', href: '/shop/jewellery/earrings' },
    },
  ],
  gifts: { eyebrow: 'Gifting', title: 'Gifts under $15', collectionSlug: 'under-15' },
  story: {
    eyebrow: 'The story',
    title: 'The evil eye, worn on purpose',
    body: [
      'The nazar, the blue-and-white eye, has been hung in doorways and pinned to cradles across Turkey, Greece and the Middle East for centuries. It is meant to catch an envious glance and send it back where it came from.',
      'Ours come in a gold-tone charm bracelet and a set of stainless steel talisman pendants: turquoise shells, antique coins, sunbursts and a north star. Protection is not guaranteed. Compliments usually are.',
    ],
    image: 'images/stainless-steel-talisman-pendant-02.jpg',
    imageAlt:
      'Stainless steel talisman pendants with turquoise shells, coins and sunbursts on black',
    links: [
      { label: 'The evil eye bracelet', href: '/products/evil-eye-charm-bracelet' },
      { label: 'Stainless steel talismans', href: '/products/stainless-steel-talisman-pendant' },
    ],
  },
  newsletter: {
    eyebrow: 'Newsletter',
    title: 'Ten percent off your first order',
    body: "Ten percent off your first order, plus first dibs on small-batch drops. We email when there's something worth opening.",
  },
}
