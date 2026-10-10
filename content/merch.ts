/**
 * Editorial defaults for departments and collections: image choices and one-line captions.
 * Images reference catalogue files; the data adapter resolves sizes and alt text.
 * Picks favour the best-photographed products (PRD 4.5): earring cards, caps, berets, talismans.
 */
export const departmentEditorial: Record<
  string,
  { image: string; tileImage: string; line: string }
> = {
  jewellery: {
    image: 'images/golden-hour-textured-hoops-02.jpg',
    tileImage: 'images/gold-ribbon-bow-drop-earrings-02.jpg',
    line: 'Gold-tone, card-mounted and ready to gift. Or to keep.',
  },
  hair: {
    image: 'images/plumeria-flower-claw-clip-01.jpg',
    tileImage: 'images/gold-loop-claw-clip-set-01.jpg',
    line: 'Claw clips that hold a full day of hair.',
  },
  bags: {
    image: 'images/linen-top-handle-mini-bag-02.jpg',
    tileImage: 'images/linen-top-handle-mini-bag-02.jpg',
    line: 'Small bags. Big opinions about what fits.',
  },
  'hats-scarves': {
    image: 'images/corduroy-baker-boy-cap-01.jpg',
    tileImage: 'images/classic-beret-01.jpg',
    line: 'Berets in six colours, for every mood of October.',
  },
  socks: {
    image: 'images/strawberry-ankle-socks-01.jpg',
    tileImage: 'images/sequin-teddy-crew-socks-01.jpg',
    line: 'Mix three pairs and save 20 percent. Six, and it is 30.',
  },
  loungewear: {
    image: 'images/suede-touch-pyjama-set-02.jpg',
    tileImage: 'images/suede-touch-pyjama-set-03.jpg',
    line: 'Staying in, with intent.',
  },
  beauty: {
    image: 'images/precision-eyelash-curler-01.jpg',
    tileImage: 'images/nail-art-brush-set-01.jpg',
    line: 'The small tools that do the fiddly work.',
  },
  charms: {
    image: 'images/faux-fur-pom-pom-charm-01.jpg',
    tileImage: 'images/good-luck-avocado-keychain-02.jpg',
    line: 'Clip one on. Find your keys faster.',
  },
}

export const collectionEditorial: Record<string, { blurb: string; image: string }> = {
  'new-in': {
    blurb: 'The latest small batches, newest first. When they go, they go.',
    image: 'images/golden-hour-textured-hoops-03.jpg',
  },
  'under-15': {
    blurb: "Good gifts that don't need a big budget. Everything here is $15 or less.",
    image: 'images/faux-fur-pom-pom-charm-02.jpg',
  },
  'gold-tone-edit': {
    blurb: 'Hoops, bows, knots and chains in a warm gold-tone finish.',
    image: 'images/gold-ribbon-bow-drop-earrings-03.jpg',
  },
  'fall-edit': {
    blurb: 'Corduroy caps, berets, plaid scarves and thermals for a fall that means it.',
    image: 'images/corduroy-baker-boy-cap-02.jpg',
  },
  talismans: {
    blurb: 'Evil eye charms and stainless steel talismans, worn for luck and for looks.',
    image: 'images/stainless-steel-talisman-pendant-02.jpg',
  },
  'gift-shop': {
    blurb: 'Card-mounted earrings, charms and cosy things, ready for someone else. Or you.',
    image: 'images/good-luck-avocado-keychain-04.jpg',
  },
}
