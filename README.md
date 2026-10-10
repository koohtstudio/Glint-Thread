# Glint & Thread

Premium editorial storefront for jewellery and accessories, sold in CAD and shipped across Canada.
The implementation follows `PRD.md`; `catalog/products.json` remains the source of truth for products.

| File | What it is |
|---|---|
| `PRD.md` | The full product requirements: brand, design system, pages, pricing engine, checkout, CMS schemas, Canadian compliance, definition of done |
| `PROMPTS.md` | The build prompts, in order. Prompt 1 builds most of the store in one run |
| `catalog/products.json` | 64 products, 179 variants, CAD prices, promotions, shipping and tax settings (Claude Code imports this) |
| `catalog/catalog.csv` | The same catalogue as a spreadsheet: review prices and fill in the **Stock** column |
| `catalog/images/` | 113 product images, auto-rotated, resized to 1600 px, location metadata stripped |

## Run locally

Use Node 24 (`nvm use` reads `.nvmrc`), install dependencies with `npm ci`, then run:

```sh
npm run dev
```

The storefront runs at `http://localhost:3000`. With `DATA_SOURCE=local`, it works without service
credentials. `npm run predev` copies catalogue photos into `public/catalog/images`.

## Connect services

Copy `.env.example` to `.env.local` and keep `.env.local` out of Git. Never put secret values in
source files or commits.

- **Sanity:** set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET=production`,
  `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN` and `SANITY_REVALIDATE_SECRET`. Run
  `npm run seed -- --dry-run`, then `npm run seed`. The seed creates missing documents and leaves
  existing Studio edits alone; `--force` replaces seeded documents.
- **Storefront data:** set `DATA_SOURCE=sanity` and restart the app. Run the Sanity adapter contract
  with `SANITY_CONTRACT=1` and the Sanity project/read-token variables exported in the test process.
- **Stripe:** use test keys first. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and
  `STRIPE_WEBHOOK_SECRET`. Stripe CLI 1.53 requires an event list when forwarding locally:

  ```sh
  stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,charge.refunded --forward-to localhost:3000/api/stripe/webhook
  ```

  Copy the printed `whsec_...` value into `.env.local`, then restart the app.
- **Resend:** set `RESEND_API_KEY`, `EMAIL_FROM` and `OWNER_EMAIL`. A Resend test-domain key may only
  send to the address associated with that Resend account. Verify a sending domain before sending to
  other recipients or using a custom `EMAIL_FROM` domain. `npm run setup:resend` creates the newsletter
  topic, segment and consent properties when the key can manage them.
- **Accounts:** Firebase Auth and Firestore require the public Firebase settings and
  `FIREBASE_ADMIN_*` service-account settings in `.env.local`. Local account/e2e flows use the Firebase
  emulators (`npm run emulators`).

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run e2e:no-emulators
npm run shots -- pass-1
npm run seed:dry
```

`npm run e2e` also starts Firebase emulators. `npm run e2e:no-emulators` builds from the current
`.env.local` and runs the browser suite, including against Sanity mode. The PRD's §14.3 launch gate
still needs its `scripts/check-launch.ts` implementation; the current `check:launch` package command
does not work until that script is added.

## Catalogue at a glance
| Department | Products | Price range (CAD) |
|---|---|---|
| Jewellery | 17 | $7.99 to $19.99 |
| Hair | 8 | $3.99 to $12.99 |
| Bags | 13 | $12.99 to $32.99 |
| Hats & Scarves | 7 | $16.99 to $24.99 |
| Socks | 9 | $5.99 to $7.99 (3+ pairs save 20%, 6+ save 30%) |
| Loungewear | 2 | $19.99 to $44.99 |
| Beauty Tools | 4 | $5.99 to $9.99 |
| Charms & Keychains | 4 | $5.99 to $8.99 |

Offers: earrings buy 2 get 1 free; WELCOME10 for newsletter sign-ups; free standard shipping across Canada over $60.
