# Glint & Thread: standing project rules

Premium dark editorial storefront for fashion jewellery and accessories. Canada only, CAD.
`PRD.md` is the spec. `catalog/products.json` wins on product data; the PRD wins on everything else.
Log every judgement call in `DECISIONS.md` (one line: decision + reason). Track milestones in `TASKS.md`.
Never delete or overwrite `PRD.md`, `PROMPTS.md`, `catalog/`. `README.md` may be extended, not lost.

@AGENTS.md

## Stack (pinned majors; check `npm view` before upgrading)
- Node 24 LTS (`.nvmrc`). Sanity 6 and Vitest 5 need Node >= 22.12.
- Next.js 16.4 App Router, React 19.3, **Cache Components on** (`cacheComponents`, `partialPrefetching`).
  Read `node_modules/next/dist/docs/` before using an API you have not used in this repo.
- TypeScript 6.0 strict (typescript-eslint does not support TS 7 yet). ESLint 9 flat config, Prettier.
- Tailwind CSS v4, CSS-first tokens in `app/globals.css` `@theme` (default palette, shadows and radii are wiped).
- `radix-ui` primitives, fully restyled. `motion` (`motion/react`). `lucide-react` icons at 1.5 stroke, 20 px.
- Zustand + persist (guarded localStorage) for the bag. Zod 4 for env, API input and catalogue import.
- Sanity 6 + next-sanity 13 (Studio at `/studio`), Stripe 23 (hosted Checkout), Resend 6 + React Email.
- Vitest (unit), Playwright (e2e, screenshots), axe-core, Lighthouse.

## Folder map
```
app/(store)/...          storefront routes (PRD 5.3)     app/api/*          route handlers
app/studio/[[...tool]]   embedded Studio (noindex)        app/dev/styleguide QA page (noindex)
components/{ui,layout,product,cart,home,listing,content}
lib/data/{index,local,sanity,types,schema,queries}.ts    the ONLY way to read catalogue/content
lib/pricing/{engine,types}.ts (+ tests)                   pure, framework-free
lib/{env,format,i18n,seo,rate-limit,stripe,orders}.ts     lib/email/{send.ts,templates/*}
content/                 default page copy (seed source for local mode and Sanity)
messages/en-CA.json      every UI string, read with t() from lib/i18n.ts
sanity/                  config, structure, schemaTypes, actions, components
scripts/                 copy-catalog-images, seed-sanity, check-launch, screenshots
e2e/                     Playwright specs
```

## Hard rules
- **Data adapter rule:** components never import `catalog/products.json`. Everything goes through
  `lib/data` (`DATA_SOURCE=local|sanity`). Both adapters return the types in `lib/data/types.ts`.
- **Money is integer cents** everywhere (`priceCents`, `amountCents`). Format only at render with
  `formatMoney()` from `lib/format.ts` (en-CA, CAD). Percentages: `Math.round(base * pct / 100)`.
- Never trust client prices. `/api/quote` and `/api/checkout` re-price from canonical data.
- Secrets live in server-only modules (`import 'server-only'`). `NEXT_PUBLIC_*` only for public values.
- The site must run with zero env vars. Stripe, Sanity, Resend are gated by env and degrade:
  no Stripe -> checkout button "Checkout opens soon", `/api/checkout` 503; no Resend -> emails log.
- Never render `photoNote`, `verify` or `unitCost` on the storefront.
- **No customer PII in Sanity (PRD 9.8)**: the dataset is public on the free plan. Orders store only order number,
  lines, amounts, status, `shippingProvince`, tracking, Stripe IDs and `emailHash` (`lib/email-hash.ts`, salted
  with server-only `EMAIL_HASH_SALT`). Names, emails, phones, addresses live in Stripe; newsletter contacts and
  their consent record live in Resend. Emails read customer details from the Stripe session at send time.
  `lib/orders.privacy.test.ts` must keep passing.
- `/api/admin/*` authenticate the Studio user's Sanity token via `users/me` + project membership
  (`lib/admin-auth.ts`). Never add a shared secret to Studio code.
- UI strings go in `messages/en-CA.json` (fr-CA ready). Content copy lives in `content/`.

## Design tokens (PRD 4.2). Use only these; no default Tailwind colours.
ink-950 #0C0B0A page bg | ink-900 #141311 surfaces | ink-800 #1B1916 mats, hover | ink-700 #2A2723
line rgba(244,239,231,0.10) hairlines | bone-50 #F4EFE7 text, light sections | bone-200 #E4DCCF
bone-300 #CFC7BA secondary | bone-500 #9A9184 muted | champagne-400 #C9A96E accent (<5% of screen)
champagne-600 #A8874C accent on light | oxblood-600 #6E2A2F promo on light only | success #7FA37A | error #D07A6E
- Radius: 0 on images/mats, 2px (`rounded-xs`) inputs/buttons, `rounded-full` only on variant chips/swatches.
- No shadows. Depth from tone (ink-950 -> 900 -> 800) and 1px `line` hairlines.
- Container max 1440, gutters 16/24/40 (`.container-x`). Grid 4/6/12 cols, gaps 16/20/24.
- Section padding 64/96/144 (`.section-y`). 8px rhythm.

## Typography (PRD 4.3)
- Display: Instrument Serif 400 + italic (`font-serif`). Italic for emphasis, never bold.
  Hero `clamp(3rem,7.5vw,7rem)` lh .95 ls -0.02em; H1 `clamp(2.5rem,5vw,4.5rem)`; H2 `clamp(2rem,3.6vw,3.25rem)`.
- Text/UI: Manrope (`font-sans`). Body 16/1.6 (15 dense). Card title 14/1.4 w500.
  Buttons 13px w600 ls .06em uppercase. Eyebrow 11px uppercase ls .18em bone-300. Prices tabular-nums w500.
- Two families only. `text-wrap: balance` on headings, `pretty` on paragraphs. Measure 60-72ch.
- Utility classes: `.t-hero .t-h1 .t-h2 .t-h3 .eyebrow .price .btn-label` in `globals.css`.

## Imagery
- Every product image sits in `<Mat>`: ink-800, 8% padding (4% mobile), 1px line border, object-contain.
- Cards 4:5. `next/image` always, exact `sizes`, `placeholder="blur"` (generated LQIP), `priority`
  only for hero and first PDP image. Low-res images (`lowRes`) are never shown wider than natural width.
- Hover (pointer only): crossfade to image 2 over 500ms, scale 1.03 over 900ms, ease `--ease-gallery`.

## Motion (PRD 4.7)
`motion` sparingly. Reveal: opacity 0->1, y 16->0, 600ms, cubic-bezier(.22,1,.36,1), stagger 60ms, once.
Drawers 350ms. `prefers-reduced-motion`: no transforms, 150ms fades. No parallax, smooth-scroll, cursor FX.

## Anti-template bans (PRD 4.8) = hard failures
1 gradients, glassmorphism cards, glow blobs, noise/mesh backgrounds  2 emoji, sparkle icons, decorative icons
3 the "three features with icons" row  4 rounded-2xl + shadow cards, default shadcn look, default focus rings,
default Tailwind colours  5 Inter/Geist/Roboto/system fonts for visible text  6 fake reviews, stars, testimonials,
"X people viewing", fake timers/countdowns, fake "was" prices  7 stock people photos, avatars, lorem ipsum,
"Product Name"  8 everything centred; hero with only headline + button  9 >2 type families; bold for hierarchy
10 layout shift from images, fonts or the bag count.

## Copy rules (PRD 3.2, 3.3)
- Canadian English (jewellery, colour, centre, favourite, cosy, pyjamas). Sentence case headings.
  Uppercase only for eyebrows/buttons. One pun per section max. Max one exclamation mark per page.
- Banned: elevate, curated (adjective), timeless elegance, must-have, game-changer, unleash, discover your,
  indulge, luxurious, "shop now" everywhere, em dashes in UI copy, emoji.
- Never claim gold, silver, sterling, hypoallergenic, tarnish-proof, waterproof. Use gold-tone, silver-tone,
  two-tone, stainless steel (only where the catalogue says so). Core copy in PRD 3.3 is verbatim.
- `npm test` runs a copy lint (`lib/copy-lint.test.ts`) over messages/ and content/.

## Commerce
- Pricing engine `lib/pricing/engine.ts` is pure; 100% branch coverage required (`npm run test:coverage`).
- Promotions: socks tiered (3+ 20%, 6+ 30%), earrings buy 2 get 1 (cheapest free). One promo per unit.
  Codes (WELCOME10) apply after automatic promos, on non-excluded lines. Free standard shipping >= $60.00
  of the discounted subtotal. Checkout uses one-off Stripe coupon for all discounts.
- TAX_MODE none (default, no tax lines) | stripe (automatic_tax).

## Commands
```
npm run dev            # copies catalogue images, starts Next on :3000 (no env needed)
npm run build && npm start
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # vitest (unit + contract + copy lint); test:coverage for engine coverage
npm run e2e            # playwright (starts the app itself)
npm run shots -- pass-3   # screenshots into screenshots/pass-3/
npm run seed -- --dry-run # Sanity seed (no keys needed for dry run)
npm run check:launch   # launch gate (PRD 14.3)
```
Use Node 24: `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH` in non-interactive shells.

## QA loop (PRD 14.2), mandatory for visual changes
1. `npm run build && npm start` (or dev) then `npm run shots -- <pass>`.
2. Open every screenshot. Critique against PRD 4: tokens, type scale, mats, alignment, spacing rhythm,
   empty space, anti-template bans, thumb reach, overflow at 360-1920.
3. Write `screenshots/<pass>/REVIEW.md` as a checklist, fix, re-shoot. Stop when only nitpicks remain.
4. Lighthouse mobile + axe on Home, Earrings, a PDP (`scripts/audit.ts`). Targets in PRD 2.
5. Commit after each milestone with a clear message.
