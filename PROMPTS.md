# Glint & Thread: Claude Code build prompts

Five prompts, in order. **Prompt 1 builds most of the store in one run.** It works with zero accounts (local catalogue mode), so you can see and click the whole site before you sign up for anything. Prompts 2 to 4 connect the real services, polish, and launch.

| # | Prompt | What you get | Your time |
|---|---|---|---|
| 0 | Setup (you, not Claude) | Folder ready, Claude Code open | 10 min |
| 1 | **The big build** | Full storefront, cart, pricing engine, Stripe/Sanity/Resend code, Studio, seed script, tests, two design QA passes | Paste and wait (long run) |
| 2 | Connect services | Real CMS data, test payments, orders in Studio, emails | 30 to 45 min (creating accounts) |
| 3 | Creative-director polish | Third and fourth design passes, performance and accessibility hardening | Paste and wait |
| 4 | Launch | Live on your domain with live payments | 30 to 60 min (DNS, Stripe activation) |
| + | Utility prompts | Resume, fix a bug, add a drop, swap photos, add French | As needed |

---

## Prompt 0: setup (do this yourself)

1. Install **Node.js 20 LTS or newer** and **Git**.
2. Unzip this starter kit into a new folder, e.g. `glint-and-thread`. It must contain `PRD.md`, `PROMPTS.md`, `README.md` and `catalog/`.
3. Open a terminal in that folder and start Claude Code (`claude`). Pick the most capable model you have for Prompt 1.
4. Let it edit files and run commands in this folder without asking every time (otherwise Prompt 1 will stop for approvals constantly).
5. Paste Prompt 1.

---

## Prompt 1: the big build (copy everything inside the box)

```text
You are a senior full-stack engineer and an exacting product designer who has shipped premium editorial e-commerce sites. Build the complete Glint & Thread online store in THIS folder, end to end, in one session.

SOURCE OF TRUTH
- PRD.md is the full specification. Read ALL of it before writing code. It defines brand, design system, pages, pricing engine, checkout, Sanity schemas, compliance and the definition of done.
- catalog/products.json is the product data (64 products, 179 variants, CAD prices, promotions, shipping, tax). catalog/images/ holds the product photos it references. Never hardcode product data in components; everything goes through lib/data.
- If PRD.md and products.json disagree on product data, products.json wins. For everything else PRD.md wins.

OPERATING RULES
1. Do not stop to ask me questions. Make the decision most consistent with the PRD, log it in DECISIONS.md (one line each: decision + reason) and keep going. Only stop for something destructive or truly impossible.
2. First, create CLAUDE.md with the standing project rules distilled from the PRD: stack and versions, folder structure, design tokens, typography, the anti-template bans (PRD 4.8), copy rules (PRD 3.2), money as integer cents, the data adapter rule, commands, and the QA loop. Keep it under 200 lines. Future sessions depend on it.
3. Create a task list that mirrors the milestones below and keep it updated as you go.
4. The folder is not empty. Do not delete or overwrite PRD.md, PROMPTS.md, README.md or catalog/. If create-next-app refuses a non-empty folder, scaffold into a temp folder and move the files in.
5. Use the latest stable versions of every package (check with npm view). For Next.js, Tailwind v4, Sanity, next-sanity, Stripe and motion, check the installed package's types and docs instead of relying on memory; APIs change.
6. git init at the start and commit after each milestone with a clear message.
7. The site must fully work in DATA_SOURCE=local with no environment keys at all. Sanity, Stripe and Resend code must be complete, but gated behind env vars and degrading gracefully exactly as PRD 8.4 describes.
8. Design quality is the top priority after correctness. Follow PRD section 4 to the letter: the dark "jewellery box at night" concept, the exact colour tokens, Instrument Serif + Manrope, the image mat treatment, asymmetric editorial layouts, restrained motion. Treat PRD 4.8 (anti-template bans) as hard failures. Restyle every Radix/shadcn primitive so no default styling survives.
9. Copy: Canadian English, sentence case, no em dashes, no emoji, no banned words (PRD 3.2). Use the core copy from PRD 3.3 verbatim. Product claims must use gold-tone / silver-tone wording exactly as the catalogue does.

MILESTONES (do them in order; each ends with tests passing and a commit)
M1 Foundation. Next.js App Router + TypeScript strict + Tailwind v4 with @theme tokens from PRD 4.2, fonts via next/font, Zod-validated env (lib/env.ts), en-CA CAD money formatter (lib/format.ts), messages/en-CA.json with a tiny t() helper, ESLint/Prettier, CLAUDE.md, DECISIONS.md, .env.example from PRD 8.4.
M2 Data layer. lib/data/types.ts, Zod schema that validates catalog/products.json at load, local adapter, script that copies catalog/images to public/catalog/images on predev/prebuild, DEV_DEFAULT_STOCK for null stock, and adapter contract tests.
M3 Pricing engine. lib/pricing/engine.ts exactly per PRD 9.1, pure TypeScript, with every test case in the PRD table plus edge cases. 100% branch coverage on the engine.
M4 Design system. All components in PRD 4.6 (buttons, links, mats, product card, variant chips, quantity stepper, accordions, toasts, inputs, drawer/sheet, badges, price) built on the tokens. Add a noindex /dev/styleguide page that shows tokens, type scale and every component state; you will use it in QA.
M5 Global layout. Announcement bar (crossfade, pauses on hover/focus), header (transparent over hero, blurred on scroll), desktop mega menu, mobile menu sheet, footer, bag drawer with free-shipping progress and promo savings, instant search overlay. Full keyboard and screen-reader support.
M6 Pages. Every route in PRD 5.3: home (all 11 sections in PRD 6.1), shop/department/category/collection listings with URL-param filters, sort, load more and editorial tiles (PRD 6.2), product page with gallery, zoom viewer, variants, sticky mobile bar, accordions, "Pairs well with", recently viewed (PRD 6.3), bag page, search, checkout success, order status, content pages seeded with PRD section 11 copy using [[PLACEHOLDER]] markers for owner facts, branded 404 and error pages.
M7 Commerce. /api/quote, /api/checkout (pending order, Stripe Checkout Session with a one-off coupon for discounts, CA-only shipping, shipping options, TAX_MODE), /api/stripe/webhook (idempotent, stock decrement, needsReview), React Email templates styled to the brand (PRD 9.6), newsletter with CASL consent and double opt-in, contact form, order-status lookup, /api/admin/ship-order, rate limiting, honeypots. Without Stripe keys the checkout button shows "Checkout opens soon" and the API returns 503; without Resend, emails log to the console.
M8 Sanity. All schemas in PRD 10, Studio embedded at /studio with the desk structure (singletons pinned, Orders section with Needs review / To ship / Shipped / All, a Needs attention list), dollars<->cents price input, margin badge, the "Mark as shipped" document action, the sanity adapter with GROQ + cache tags, /api/revalidate with signature check, TypeGen, and scripts/seed-sanity.ts (idempotent, deterministic IDs, uploads images, --dry-run works with no keys).
M9 SEO, accessibility, performance, security. Metadata and title template, canonical URLs, JSON-LD (Organization, WebSite, Product, BreadcrumbList, FAQPage), sitemap, robots, OG images, security headers with a CSP that allows Stripe and Sanity, server-only guards on secrets, reduced-motion support, focus styles, skip link.
M10 QA and design review loop. Vitest suite green. Playwright e2e: home -> category -> filter -> PDP -> choose variant -> add to bag -> bag shows the sock bundle discount and earring B2G1 correctly -> checkout button state. scripts/screenshots.ts (npm run shots) capturing the pages and widths listed in PRD 14.2. Then run the review loop: open EVERY screenshot yourself, critique it against PRD section 4 like a demanding creative director (alignment, spacing rhythm, type scale, hierarchy, mats, image sizing, empty space, anti-template bans, mobile thumb reach, overflow), write screenshots/<pass>/REVIEW.md, fix everything, re-shoot. Do at least two full passes. Run Lighthouse (mobile) and axe on Home, Earrings and a PDP and fix until PRD section 2 targets are met or document exactly why not.
M11 Handover. README.md with run instructions (npm run dev, test, shots, seed, check:launch), scripts/check-launch.ts per PRD 14.3, and a final report.

FINAL REPORT (your last message)
- What was built (by milestone), with anything skipped and why.
- How to run it locally in one command.
- Which env vars unlock which features.
- Decisions you made (summary of DECISIONS.md).
- The REVIEW.md findings from your last pass that you consciously left as nitpicks.
- The top 5 things the owner must provide (from PRD 15).

Start now: read PRD.md, inspect catalog/products.json, write CLAUDE.md, create the task list, then work through M1 to M11 without stopping.
```

---

## Prompt 2: connect the real services

Before pasting, create free accounts (test mode is fine): **Sanity** (sanity.io), **Stripe** (stripe.com, stay in test mode), **Resend** (resend.com). Install the Stripe CLI if you want to test webhooks locally.

```text
Read CLAUDE.md and DECISIONS.md first. Now we connect the real services. Guide me step by step and do every part you can do yourself.

1. Sanity: tell me exactly what to click to create the project (dataset "production"), the read token (Viewer) and write token (Editor), and the CORS origin for http://localhost:3000 with credentials allowed. If a step needs an interactive login, tell me the exact command to run myself and wait. When I paste the values, write them into .env.local (never commit it).
2. Run scripts/seed-sanity.ts with --dry-run, show me the summary, then run it for real. Verify the counts in Sanity match products.json (64 products, 179 variants, departments, categories, promotions, promo codes, settings, home page, pages, care guides).
3. Switch DATA_SOURCE=sanity, restart, and run the adapter contract tests and e2e suite against Sanity. Fix any differences between the local and Sanity adapters.
4. Stripe (test mode): put my test keys in .env.local, start "stripe listen --forward-to localhost:3000/api/stripe/webhook", save the webhook secret, then do a full test purchase using card 4242 4242 4242 4242 with 3 socks + 3 earrings + WELCOME10 to an Ontario address. Prove it worked: order status paid in Studio, amounts match the quote, stock decremented once, webhook replay is a no-op, confirmation email sent or logged. Then test "Mark as shipped" from Studio and the shipping email.
5. Resend: put the API key in .env.local. Send yourself (OWNER_EMAIL) every template once and show me the subjects. Tell me what DNS records I'll need for my own domain at launch.
6. Update README.md and DECISIONS.md, commit, and give me a short report with anything still blocked on me.
```

---

## Prompt 3: creative-director polish

```text
Read CLAUDE.md, DECISIONS.md and the latest screenshots/*/REVIEW.md first.

Act as a demanding creative director at a premium jewellery brand who is about to approve this site for launch. Nothing generic gets through.

1. Run npm run shots for a new pass at 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px, plus a 390 px landscape pass. Include hover and open states: mega menu, quick add, bag drawer with discounts, filter sheet on mobile, zoom viewer, search overlay with results, newsletter success, sold-out variant, empty bag, 404.
2. Review every screenshot against PRD section 4 and these questions: Does it feel like a boutique or a template? Is the type doing the work? Is there one clear focal point per screen? Are the mats consistent and the images never upscaled or soft? Is the spacing rhythm consistent (8 px base)? Are the champagne accents under 5% of the screen? Any orphans or widows in headings? Anything centred that should be editorial and offset? Any default browser or library styling left? Write the findings in REVIEW.md, ranked by severity.
3. Fix everything above "nitpick". Then add the finishing touches: loading skeletons that match the mats (no grey boxes), optimistic bag updates with rollback, view transitions between listing and product where the browser supports it (progressive enhancement, reduced-motion safe), focus-visible states that look designed, a print stylesheet for the order confirmation page, and a favicon/app icon set using the G&T monogram in Instrument Serif on ink-950.
4. Copy pass: proofread every visible string, product and email against PRD 3.2 (Canadian spelling, no em dashes, no banned words, one pun per section maximum, honest material wording).
5. Performance and accessibility: Lighthouse mobile on Home, Earrings, a PDP and Search, plus axe on every page type. Meet PRD section 2 targets. Check the PDP first-load JS budget (under 150 KB gzipped) and remove what's heavy.
6. Re-shoot, re-review, and repeat until a pass finds nothing above nitpick. Commit and report before/after screenshots of the five biggest improvements.
```

---

## Prompt 4: launch

Before pasting: buy or choose a domain, create a **GitHub** account and a **Vercel** account, and activate your Stripe account for live payments (business details and bank account).

```text
Read CLAUDE.md and DECISIONS.md first. We are launching. Guide me step by step and do every part you can do yourself.

1. Fill in the owner facts: ask me for the legal business name, mailing address, contact email, domain, my GST/HST registration status (sets TAX_MODE), local pickup yes/no and address, and the About story (I can give you rough notes; you write it in the brand voice and show me before saving). Replace every [[PLACEHOLDER]] in Sanity and code.
2. Stock: import the stock counts from catalog/catalog.csv (I will fill the "Stock (fill in)" column) into Sanity, matching by SKU. Show me any SKUs that didn't match.
3. Run npm run check:launch and fix or list everything it flags. Show me the remaining photoNote and verify items as a checklist I can work through.
4. Create the GitHub repo and push. Walk me through importing it into Vercel, setting every production env var (live Stripe keys, NEXT_PUBLIC_SITE_URL with my domain, DATA_SOURCE=sanity, TAX_MODE), and connecting the domain.
5. Production wiring: Stripe live webhook endpoint (checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, charge.refunded) and its secret; the Sanity webhook to /api/revalidate with its secret; Sanity CORS for the production domain; Resend domain verification (give me the exact DNS records); Stripe Checkout branding (colours and icon to match the site); Apple Pay domain verification if needed.
6. Smoke test production: a real low-value purchase, check the order, emails and stock, then refund it and check the refund webhook. Submit the sitemap to Google Search Console.
7. Final report: the live URL, what's monitored, and a one-page "how to run the shop" guide for the owner (add a product, update stock, run a promo, ship an order, issue a refund). Save the guide as OWNER_GUIDE.md.
```

---

## Utility prompts

**Resume after an interruption or a full context window**
```text
Re-read CLAUDE.md, DECISIONS.md, PRD.md (only the sections relevant to the open tasks) and the task list. Run git log --oneline -15 and the test suite to see where we are. Then continue from the first unfinished milestone without redoing finished work.
```

**Fix a bug**
```text
Bug: [what you did] -> [what happened] -> [what should happen]. Page/URL: [..] Screen width: [..]
Reproduce it first (write a failing test or Playwright step), fix the root cause, run the full test suite and npm run shots for the affected page, and tell me what caused it in two sentences.
```

**Add a new product drop**
```text
I'm adding new products. Here are the photos (in catalog/new/) and my notes: [name, price, colours, sizes, materials, stock]. Write titles and descriptions in the brand voice (PRD 3.2), process the photos like the existing catalogue (4:5 mat-ready, metadata stripped, 1600 px), create them in Sanity via a script with deterministic IDs, add them to "New In", and screenshot the new PDPs at 390 and 1440 px.
```

**Swap in reshot photos**
```text
New photos are in catalog/reshoot/, named by product slug (slug-01.jpg, slug-02.jpg...). Process them like the catalogue images, replace the images on those products in Sanity (keep alt text, update it if the shot changed), clear their photoNote, and show me before/after screenshots of each affected PDP and the listing grids.
```

**Add French (fr-CA)**
```text
Add a French (Canada) version of the site per PRD 12.6: locale routing (/fr), translated UI strings in messages/fr-CA.json, translatable fields in Sanity (product title, descriptions, details, pages, settings) with a translation status badge in Studio, hreflang tags, a language switcher in the header and footer, and French email templates. Use natural Quebec French, not literal translation. Show me 10 sample product translations before doing the rest.
```
