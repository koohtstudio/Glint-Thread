# Glint & Thread: Product Requirements Document

**Product:** Glint & Thread, a premium-feeling online boutique for artificial (fashion) jewellery and everyday accessories, selling across Canada in CAD.
**Version:** 1.0 (launch scope)
**Date:** 10 October 2026
**Build tool:** Claude Code, driven by `PROMPTS.md`
**Data provided:** `catalog/products.json` (64 products, 179 variants, CAD pricing, promotions, shipping, tax), `catalog/catalog.csv` (same data for spreadsheet review), `catalog/images/` (113 web-ready product images, metadata stripped)

> **How to read this document.** Sections 1 to 4 say *what* and *why*. Sections 5 to 13 say *exactly how*. Section 14 is the definition of done. Section 15 lists what the owner still has to supply. When this PRD and the catalogue disagree, `catalog/products.json` wins for product data and this PRD wins for everything else.

---

## 1. Summary

Glint & Thread sells gold-tone, silver-tone and stainless steel fashion jewellery, plus the accessories that sit around it: hair clips, mini bags, berets and baker boy caps, blanket scarves, novelty socks, pyjama sets, beauty tools and bag charms. The stock is small-batch and largely imported from Turkey.

The site must feel like a premium boutique (think editorial jewellery brands), not a dropshipping template, while staying fast, accessible and cheap to run. Launch scope is Canada-only shipping, CAD pricing, customer accounts (Firebase Auth), our own one-page checkout with Stripe used **only for payment** (Payment Element, Express Checkout Element, PaymentIntents), guest checkout, provincial sales tax calculated by our own pricing engine, and a CMS (Sanity) the owner can run without a developer.

**Tagline:** *All the glint. None of the gold loan.*

## 2. Goals, non-goals, success metrics

### Goals (launch)
1. A storefront that looks and feels premium on every screen size from 360 px phones to 1920 px desktops.
2. End-to-end commerce: browse → product → bag → our `/checkout` page (Stripe Payment Element) → paid order in the CMS (no personal data) and in the customer's account → confirmation email → owner marks shipped → shipping email.
3. Owner self-service in Sanity Studio: products, prices, stock, photos, promotions, homepage, policies, tax rates, orders.
4. Correct Canadian commerce behaviour: CAD formatting, Canada-only shipping, honest product claims, CASL-compliant email capture, tax handling that matches the business's registration status.
5. Works on day one with zero accounts (local catalogue mode), then switches on Sanity, Stripe, Resend and Firebase by adding environment variables. Without Firebase keys, customer accounts are hidden and guest checkout still works.
6. Customer accounts: sign up and sign in, order history with tracking, saved addresses, profile, marketing preferences and self-service account deletion (PIPEDA).

### Non-goals (v1)
Wishlists synced to an account (a local wishlist is fine), multi-currency, international shipping, reviews (no fake ones, ever), loyalty points, marketplace integrations, French site (architecture must be ready for it; see §12).

### Success metrics (first 90 days)
| Metric | Target |
|---|---|
| Lighthouse mobile (home, PLP, PDP) | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 |
| Core Web Vitals (field) | LCP < 2.5 s, CLS < 0.05, INP < 200 ms |
| Conversion rate | ≥ 1.5 % of sessions |
| Average order value | ≥ $40 CAD (bundles and the $60 free-shipping threshold are the levers) |
| Checkout errors | 0 unhandled; every Stripe webhook processed idempotently |

## 3. Brand

### 3.1 Name and positioning
- **Name:** Glint & Thread. "Glint" covers the jewellery; "Thread" covers the textiles (socks, scarves, hats, pyjamas). The monogram is **G&T**. Yes, like the drink. The About page is allowed one joke about it.
- **Positioning:** affordable, honest, well-chosen. Prices sit at or slightly above mall fast-fashion (Ardene) on everyday items, and above it on statement and stainless steel pieces, justified by curation, presentation and service.
- **Promise:** small batches, honest materials honestly labelled, shipped across Canada.

### 3.2 Voice
Warm, confident, a little witty. Writes like a stylish friend, not a brand deck.
- Canadian English: jewellery, colour, centre, favourite, cosy, pyjamas.
- Sentence case for headings. Uppercase only for small eyebrow labels.
- **One pun per section, maximum.** Wit is seasoning.
- **Banned words and phrases:** elevate, curated (as an adjective), timeless elegance, must-have, game-changer, unleash, discover your, indulge, luxurious (we are not), "shop now" on every block, exclamation marks (one per page at most), em dashes in UI copy, emoji.
- Never claim "gold", "silver", "sterling", "hypoallergenic", "tarnish-proof" or "waterproof" unless it is literally true and verified. Use **gold-tone**, **silver-tone**, **two-tone**, **stainless steel** (only where the packaging says so).

### 3.3 Core copy (use verbatim unless the owner changes it in the CMS)
| Slot | Copy |
|---|---|
| Hero headline | All the glint. *None of the gold loan.* (second sentence in italic) |
| Hero sub | Gold-tone jewellery and everyday accessories, chosen in small batches and shipped across Canada. |
| Hero CTAs | Shop jewellery · See the fall edit |
| Announcement bar (rotates) | Free shipping across Canada on orders $60+ · Socks: 3+ pairs save 20% · Earrings: buy 2, get 1 free |
| Brand band | Small batches. Honest materials, honestly labelled. Shipped across Canada. |
| Free-shipping progress | You're $X.XX away from free shipping. / Free shipping unlocked. |
| Empty bag | Your bag is feeling a little light. |
| 404 | This page wandered off, like the other earring. |
| Newsletter | Ten percent off your first order, plus first dibs on small-batch drops. We email when there's something worth opening. |
| Sold out | Sold out. These were small-batch, and they went. |
| Footer sign-off | All the glint. None of the gold loan. |

## 4. Design system

### 4.1 Concept: "the jewellery box at night"
The product photography is shot on black. Instead of fighting that, the whole site becomes a dark, warm gallery: product images are presented like **framed prints in a mat**, the interface is quiet, typography does the heavy lifting, and light editorial sections in warm bone colour create rhythm. Gold is used like real gold: rarely, and where it counts.

Reference *qualities* (do not copy layouts or assets): the restraint of an editorial jewellery brand, the typographic confidence of a fashion magazine, the calm of a well-lit gallery.

### 4.2 Colour tokens
Define as CSS variables in Tailwind v4 `@theme`. No default Tailwind palette colours (no `blue-500`, `gray-*`) anywhere in the codebase.

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0C0B0A` | Page background |
| `ink-900` | `#141311` | Surfaces: header on scroll, drawers, inputs |
| `ink-800` | `#1B1916` | Image mats, hover surfaces |
| `ink-700` | `#2A2723` | Borders on hover, disabled fills |
| `line` | `rgba(244,239,231,0.10)` | Hairline borders and dividers (1 px) |
| `bone-50` | `#F4EFE7` | Primary text on dark; light section background |
| `bone-200` | `#E4DCCF` | Light-section borders |
| `bone-300` | `#CFC7BA` | Secondary text on dark |
| `bone-500` | `#9A9184` | Muted text, placeholders (≥ 4.5:1 on ink-950) |
| `champagne-400` | `#C9A96E` | Accent: focus rings, active states, progress bar, the occasional link. Under 5 % of any screen. |
| `champagne-600` | `#A8874C` | Accent text on light sections |
| `oxblood-600` | `#6E2A2F` | Promo emphasis on light sections only, sparingly |
| `success` | `#7FA37A` | Inline success text |
| `error` | `#D07A6E` | Inline error text |

Contrast: all text meets WCAG 2.1 AA. Check `bone-500` on `ink-900` before using it for body copy.

### 4.3 Typography
Load with `next/font/google`, `display: swap`, self-hosted by Next.

| Role | Font | Spec |
|---|---|---|
| Display (headlines, wordmark, product titles on PDP) | **Instrument Serif** (regular + italic) | Hero `clamp(3rem, 7.5vw, 7rem)`, line-height 0.95, letter-spacing −0.02em. H1 `clamp(2.5rem, 5vw, 4.5rem)`. H2 `clamp(2rem, 3.6vw, 3.25rem)`. Use italic for emphasis words, never bold. |
| Text and UI | **Manrope** | Body 16 px / 1.6 (15 px on dense UI). Product card title 14 px / 1.4, weight 500. Buttons 13 px, weight 600, letter-spacing 0.06em, uppercase. |
| Eyebrows and labels | Manrope | 11 px, uppercase, letter-spacing 0.18em, `bone-300`. |
| Prices | Manrope | `font-variant-numeric: tabular-nums`, weight 500. |

Rules: two families only. `text-wrap: balance` on all headings and `text-wrap: pretty` on paragraphs. No widows in headlines. Body measure 60 to 72 characters.

### 4.4 Layout, grid, spacing
- Container max width 1440 px. Side gutters: 16 px (< 640), 24 px (640 to 1023), 40 px (≥ 1024).
- 12-column grid on desktop, 6 on tablet, 4 on mobile; column gap 16/20/24 px.
- Vertical rhythm on an 8 px base. Section padding: 64 px mobile, 96 px tablet, 144 px desktop.
- Layouts are **asymmetric and editorial**: offset image and text blocks, mixed tile sizes, generous negative space. Avoid rows of identical centred cards.
- Radius: 0 on images and mats, 2 px on inputs and buttons. No pills except tiny variant chips (999 px radius allowed there).
- Shadows: none. Depth comes from tone (`ink-950` → `ink-900` → `ink-800`) and hairlines.

### 4.5 Imagery treatment
- **The mat:** every product image sits in an `ink-800` mat with an 8 % inner padding (4 % on mobile) and a 1 px `line` border. The image itself is `object-contain`, centred. This makes photos with slightly different black backgrounds read as a deliberate series of framed prints.
- Card aspect ratio 4:5. PDP gallery images 4:5 on mobile, natural ratio inside a 4:5 mat on desktop.
- Hover (pointer devices only): crossfade to the second image over 500 ms; scale the image to 1.03 over 900 ms with `cubic-bezier(0.22, 1, 0.36, 1)`.
- Use `next/image` everywhere with correct `sizes`, `placeholder="blur"` (dominant-colour or LQIP), `priority` only on the hero and the first PDP image.
- Editorial and hero images may be full-bleed (no mat). Use the best-photographed products for these: the earring cards, the baker boy caps, the berets, the talisman pendants.
- Some catalogue images are low-resolution crops or still in packaging (`photoNote` in the catalogue). Never upscale them past their natural width: use `sizes` so they render small, and the owner replaces them later (§15).

### 4.6 Components (visual and behavioural spec)
**Announcement bar.** 36 px high, `ink-900`, 11 px eyebrow style, centred. Messages crossfade every 5 s (no marquee). Pauses on hover and focus. Close button is not needed.

**Header.** 64 px mobile, 76 px desktop. Transparent over the home hero, becomes `ink-950/85` with `backdrop-blur-md` and a bottom hairline after 24 px of scroll. Layout: desktop nav left (departments), wordmark centred (Instrument Serif, 26 px, the ampersand in italic), right side: Search, Bag (count in tabular numerals). Mobile: menu button left, wordmark centre, bag right; search lives in the menu sheet.

**Mega menu (desktop).** Opens on hover with a 120 ms intent delay, or on click and keyboard. Full-width `ink-900` panel: category links in columns, plus one editorial image tile with a one-line caption. Closes on Escape, on outside click and on route change.

**Mobile menu.** Full-height sheet from the left. Departments as large serif links (32 px) that expand to categories. Search field at the top. Footer links small at the bottom.

**Buttons.**
- Primary: `bone-50` background, `ink-950` text, 48 px tall, uppercase 13 px. Hover: background `champagne-400`. Active: translateY(1px). Loading: label swaps to a thin animated line (no spinner wheels).
- Secondary: transparent with 1 px `bone-50` border; hover fills `bone-50/8`.
- Text link: underline offset 4 px, thickness 1 px, animates from 0 to 100 % width on hover.

**Product card.** Mat image (4:5) → 12 px gap → title (14 px, 2-line clamp) → price row (price, then compare-at struck through only if a real compare-at price exists). Promo badge as a tiny uppercase label in the top-left of the mat (`bone-50` text on `ink-950/70`, no colours). Colour swatches (max 5 plus "+3") under the price when variants have colours. Desktop hover shows a "Quick add" bar at the bottom of the mat: adds directly for single-variant products, opens the variant sheet otherwise. Whole card is one link; quick add is a separate button (no nested interactive elements).

**Variant selector.** Chips with text labels (never colour-only). Selected: `bone-50` border and text; sold out: diagonal hairline strike and `aria-disabled`. Selecting a variant with its own image swaps the gallery to that image.

**Bag drawer.** Right side, 440 px wide on desktop, full-width on mobile. Header "Your bag (n)". Free-shipping progress: a 2 px hairline track that fills in `champagne-400`. Line items: 72 px matted thumbnail, title, variant, quantity stepper, line price, and promo savings shown as a quiet line ("Mix & match −$4.19"). Footer: subtotal, savings, "Shipping and taxes calculated at checkout", primary Checkout button, payment marks. Includes an "Under $10 add-ons" row of 3 small cards. Focus is trapped while open; Escape closes; focus returns to the trigger.

**Accordions** (Details, Care, Shipping & returns): hairline separators, a plus icon that rotates 45 degrees, height animation 250 ms.

**Toasts.** Bottom-centre on mobile, bottom-right on desktop, `ink-900` with hairline, auto-dismiss after 4 s, announced via `aria-live="polite"`.

**Forms.** Underline-style inputs (bottom border only) on dark, 48 px tall, labels as eyebrows above. Errors inline below the field in `error` colour with an icon-free message.

**Icons.** One set only: Lucide at 1.5 px stroke, 20 px. Used for UI affordances (search, bag, close, plus, chevrons), never as decorative "feature icons".

### 4.7 Motion
Use the `motion` package, sparingly.
- Section reveal on scroll: opacity 0 → 1, y 16 px → 0, 600 ms, ease `cubic-bezier(0.22, 1, 0.36, 1)`, stagger children 60 ms, once only.
- Hero: headline lines reveal with a 70 ms stagger; the hero image scales from 1.04 to 1.0 over 1.6 s on load.
- Drawers and sheets: 350 ms slide with the same ease; backdrop fades to `ink-950/60`.
- Respect `prefers-reduced-motion`: disable transforms, keep opacity fades at 150 ms.
- No parallax, no scroll-jacking, no smooth-scroll libraries, no cursor effects, no confetti.

### 4.8 Anti-template rules (hard bans)
The site fails review if any of these appear:
1. Gradients of any kind on backgrounds or text, glassmorphism cards, glowing blobs, mesh or noise "AI" backgrounds.
2. Emoji anywhere in the UI or copy; sparkle icons; icons used as decoration.
3. The "three features with icons" row (free shipping / secure checkout / support). Use the single typeset brand band instead.
4. Rounded-2xl cards with drop shadows; default shadcn/ui styling left in place; default focus rings; default Tailwind colours.
5. Inter, Geist, Roboto or system UI fonts for visible text.
6. Fake social proof: invented reviews, star ratings, testimonials, "12 people are viewing", stock countdowns that aren't real, fake timers, fake "was" prices.
7. Stock photos of people, placeholder avatars, lorem ipsum, "Product Name" placeholders on a live page.
8. Everything centred. Hero with only a headline and a button.
9. More than two type families; bold used for hierarchy instead of size and spacing.
10. Layout shift when images, fonts or the bag count load.

### 4.9 Responsive requirements
Test at 360, 390, 430, 768, 1024, 1280, 1440 and 1920 px wide, plus 390 px in landscape.
- No horizontal scrolling at any width; nothing clipped or overlapping.
- Tap targets ≥ 44 × 44 px; primary actions reachable with one thumb on phones.
- PLP grid: 2 columns < 768, 3 columns 768 to 1279, 4 columns ≥ 1280.
- PDP: single column with swipeable gallery (CSS scroll-snap, "1 / 4" counter) and a sticky bottom "Add to bag" bar on mobile; two columns (gallery 7/12, sticky info 5/12) from 1024.
- Type scales fluidly with `clamp()`; no breakpoint jumps in headline size.

## 5. Information architecture

### 5.1 Departments and categories
Defined in `catalog/products.json` → `departments`, `categories`.

| Department | Categories | Products |
|---|---|---|
| Jewellery | Earrings, Necklaces, Bracelets | 17 |
| Hair | Claw Clips & Clips, Headbands, Hair Ties, Brushes | 8 |
| Bags | Mini Bags, Pouches & Purses | 13 |
| Hats & Scarves | Hats & Berets, Scarves | 7 |
| Socks | Ankle Socks, Crew Socks | 9 |
| Loungewear | Pyjamas, Thermals | 2 |
| Beauty Tools | Beauty Tools | 4 |
| Charms & Keychains | Keychains & Bag Charms | 4 |

### 5.2 Collections (rule-based, CMS-overridable)
New In · Gifts Under $15 · The Gold-Tone Edit · Sweater Weather (fall/winter) · Talismans & Evil Eye · The Gift Shop. Rules are in `products.json` → `collections`. In Sanity a collection can be rule-based (tags, max price) or hand-picked.

### 5.3 Routes
| Route | Purpose |
|---|---|
| `/` | Home |
| `/shop` | All products |
| `/shop/[department]` | Department listing |
| `/shop/[department]/[category]` | Category listing |
| `/collections/[slug]` | Collection listing |
| `/products/[slug]` | Product detail |
| `/search?q=` | Search results (plus an instant-search overlay from the header) |
| `/bag` | Full-page bag (fallback; the drawer is primary) |
| `/checkout` | One-page checkout: contact, shipping address and method, payment (Stripe Payment Element, Express Checkout Element). Replaces the Stripe-hosted redirect. noindex |
| `/checkout/success?order=` | Order confirmation (Stripe appends `payment_intent` and `payment_intent_client_secret`) |
| `/account` | Account overview (noindex; redirects to sign-in when signed out) |
| `/account/orders`, `/account/orders/[orderNumber]` | Order history, order detail with status and tracking |
| `/account/addresses` | Saved addresses (add, edit, delete, default) |
| `/account/profile` | Profile, password, delete my account |
| `/account/preferences` | Marketing preferences (synced to the Resend Newsletter topic) |
| `/account/sign-in`, `/account/sign-up`, `/account/forgot-password`, `/account/action` | Auth pages; `action` handles email verification, password reset and email-link sign-in links |
| `/order-status` | Look up an order by order number and email |
| `/about`, `/shipping-returns`, `/faq`, `/contact`, `/care`, `/size-guide`, `/privacy`, `/terms`, `/accessibility` | Content pages, editable in Sanity |
| `/studio/[[...tool]]` | Embedded Sanity Studio (noindex) |
| `not-found`, `error` | Branded 404 and error pages |

### 5.4 Navigation
- Header: Jewellery, Hair, Bags, Hats & Scarves, Socks, More (Loungewear, Beauty Tools, Charms & Keychains), plus a "Gifts" link to The Gift Shop.
- Footer columns: Shop (departments), Help (Shipping & returns, FAQ, Care guide, Size guide, Order status, Contact), About (Our story, Accessibility, Privacy, Terms), Newsletter.
- Breadcrumbs on listing and product pages (also as JSON-LD).

## 6. Page specifications

### 6.1 Home (`/`), all sections editable via the Sanity `homePage` singleton
1. **Announcement bar** (§4.6).
2. **Hero, split editorial.** Desktop: image 7/12 left (full-bleed to the viewport edge, 88 vh max, min 560 px), text 5/12 right, vertically centred, left-aligned. Eyebrow "Small-batch jewellery & accessories", the headline, the sub, two CTAs (primary + text link). Mobile: headline first, then image at 4:5, then CTAs. Default image: the earring-card group shot (`catalog/images/gold-ribbon-bow-drop-earrings-02.jpg`).
3. **The Edit.** Eyebrow + H2 "This week's edit". A horizontal scroller of 8 featured products (`featured: true`) with scroll-snap, visible next-card peek on mobile and arrow buttons on desktop.
4. **Shop by department.** Asymmetric mosaic: Jewellery (large, 2 × 2), Hats & Scarves (tall, 1 × 2), then Bags, Hair, Socks, Charms (1 × 1). Each tile: matted image, serif department name, product count in eyebrow style. Loungewear and Beauty appear as text links under the mosaic ("Also: Loungewear, Beauty Tools").
5. **Brand band** on `bone-50` with `ink-950` text: the brand line in display serif at H1 size, and three short paragraphs below (no icons): Small batches · Honest materials, honestly labelled · Shipped across Canada.
6. **Collection spotlight: Sweater Weather.** Image left (baker boy caps), H2 and two lines right, then 4 products from the collection.
7. **Offers band.** Two typographic panels side by side (stacked on mobile): "Mix & match socks. 3+ pairs save 20%." and "Earrings. Buy 2, get 1 free." Each links to its category. No banners or coloured boxes; just type, hairlines and space.
8. **Gifts under $15.** Product row.
9. **Talismans story.** Full-bleed image of the stainless steel pendants, a short paragraph on the evil eye (nazar) as a symbol of protection, and links to the bracelet and pendants.
10. **Newsletter** on `bone-50` (§10.6).
11. **Footer.**

### 6.2 Listing pages (department, category, collection, all, search)
- Header block: eyebrow (department), H1 (serif), one-line blurb from the catalogue, product count.
- Sticky filter bar under the header (hairline top and bottom): Category (department pages only), Finish (Gold-tone / Silver-tone / Two-tone / Stainless steel, derived from tags), Colour (derived from variant names), Price (Under $10, $10 to $20, $20 to $40, $40+), In stock only, and Sort (Featured, Newest, Price low to high, Price high to low). Mobile: a "Filter & sort" button opens a bottom sheet with an "Apply (n results)" button.
- Filters are URL search params (shareable, back-button safe). Results update without a full reload.
- Grid per §4.9. After every 8th product insert an **editorial tile** spanning 2 columns: a full-bleed image and one serif line (CMS-editable per department, with a sensible default).
- Pagination: "Load more" (24 per page) with the URL updated; no infinite scroll.
- Empty state: "Nothing matches those filters." plus a "Clear filters" button.

### 6.3 Product detail (`/products/[slug]`)
- **Gallery:** desktop shows a vertical stack of matted images in the left 7 columns; the right info column is sticky. Mobile is a scroll-snap carousel with a counter. Click or tap opens a full-screen zoom viewer (pinch-zoom on touch, arrow-key navigation, Escape to close).
- **Info column:** breadcrumb → title (Instrument Serif, H1 size) → price (and compare-at if real) → promo line if eligible ("Part of Mix & Match: 3+ pairs save 20%") → short description → variant selector(s) → quantity stepper → Add to bag (primary, full width) → stock note ("Only 3 left" when stock ≤ 3; "Sold out" state per §3.3) → reassurance line in small type: "Free shipping over $60 · 30-day returns on eligible items".
- **Accordions:** Description (long copy), Details (bullet list from `details`), Care (from the care guide referenced by `careGuide`), Shipping & returns (from site settings; flag final-sale items).
- **Below the fold:** "Pairs well with" (4 products sharing tags, same department first), "Recently viewed" (localStorage, try/catch, max 8).
- Mobile: sticky bottom bar with price + Add to bag once the main button scrolls out of view.
- Structured data: `Product` JSON-LD with `offers` (priceCurrency CAD, availability from stock, url, sku), and `BreadcrumbList`.

### 6.4 Bag and checkout flow
1. Add to bag → drawer opens with the added item highlighted for 1.2 s.
2. The bag drawer shows a server-computed quote (§9.1): subtotal, automatic promotion savings, free-shipping progress. Signed-in customers' bags persist across devices (§9.9).
3. Promo code field (collapsed by default, "Have a code?").
4. **Checkout** → `/checkout` (our page; no redirect to Stripe). One page, three sections that open in turn on mobile (each with a "Continue" and an "Edit" on completed sections) and sit together on desktop beside a **sticky order summary**:
   1. **Contact:** email (prefilled and locked when signed in; guests see a "Create an account" checkbox, unchecked).
   2. **Shipping:** Canadian address (province select, postal code validated and normalised to `A1A 1A1`, and checked against the province), phone, saved addresses selectable when signed in; shipping method from our shipping settings.
   3. **Payment:** Stripe **Payment Element**, with the **Express Checkout Element** (Apple Pay, Google Pay) at the top of the page.
5. The order summary shows lines, promotion savings, promo code field, shipping, **each tax line by name** (for example "HST (ON) 13%", or "GST 5%" plus "PST (BC) 7%") and the total. Every number comes from the server pricing engine and is re-quoted whenever the address, shipping method, code or bag changes.
6. Pay → `stripe.confirmPayment` → `/checkout/success?order=…`: an editorial confirmation ("It's on its way soon.") with the order number, items, totals including tax lines, and what happens next; clears the bag. The page verifies the PaymentIntent server-side, so a refresh is safe. 3-D Secure and redirect-based methods return to the same URL.
7. Declined or failed payments show the Stripe message inline under the Payment Element; the bag and form stay intact.

### 6.5 Search
Header search opens an overlay with instant results (debounced 150 ms) showing up to 6 products with thumbnails, plus "See all results". The full results page uses the listing layout. Matching covers title, tags, category, department and variant names. Empty state suggests the department links.

### 6.6 Content pages
Long-form pages use a centred 680 px reading column, serif H1, Manrope body at 17 px, generous spacing, and Portable Text from Sanity (headings, lists, links, images with captions, callouts). Seed them with the copy in §11 and §12, with owner-specific facts marked `[[LIKE_THIS]]` (the launch check fails while these remain).

### 6.7 404 and error
Full-height `ink-950`, serif line from §3.3, a search field and four department links. The error page has a retry button and a contact link.

## 7. Catalogue, pricing and offers

### 7.1 Catalogue data
`catalog/products.json` is the import source. Per product: `slug, sku, title, department, category, priceCents, compareAtPriceCents (null), currency, shortDescription, description, details[], careGuide, optionNames[], variants[{title, options, sku, priceCents, stock}], images[{file, width, height, alt, source}], tags[], featured, excludedFromPromotions, photoNote, verify[], status`.
- `stock: null` means "not yet counted". Development seeds a default (env `DEV_DEFAULT_STOCK=10`). Launch is blocked until every variant has a real number (§14.3).
- `verify[]` lists facts the photos could not confirm (dimensions, fibre content and so on). They show in the Studio as a warning panel on the product, never on the storefront.
- `photoNote` flags images that need a reshoot. Studio shows it; the storefront doesn't.

### 7.2 Pricing rationale (CAD)
Anchored to Canadian mall pricing checked in October 2026 (Ardene.com "Now" prices):

| Item type | Market anchor | Our price | Logic |
|---|---|---|---|
| Basic hoops and studs | Ardene $7.90 (single), 14K plated hoops $12.90 to $14.90 | $9.99 | Slightly above mall price: better presentation, gift card |
| Statement earrings (bows, puffy drops, two-tone) | Ardene statement $7.90 to $9.90 | $11.99 to $14.99 | Trend pieces; not commodity |
| Earring multi-sets | Ardene 6 to 9 packs $9.90 to $12.90 | $9.99 to $12.99 | At market |
| Fashion charm necklaces | Ardene pendants $7.90 to $9.90 | $13.99 | Chunkier chains, more distinctive charms |
| Stainless steel pendants | Ardene stainless chain $12.90, stainless hoops $17.90 | $19.99 | Durability premium, talisman story |
| Evil eye bracelet | Ardene 14K plated evil eye necklace $12.90 | $12.99 | At market |
| Claw clip set (3, metal) | Ardene single claw $5.90 | $12.99 | Three-piece metal set |
| Headband sets, padded headbands | Ardene faux fur headband $12.90 | $11.99 | Just under market |
| Berets | Ardene beanies $12.90, tuques $17.90 | $16.99 | Between beanie and wool tuque |
| Baker boy caps with chain | (no direct Ardene equivalent) | $24.99 | Statement fall piece |
| Blanket scarves | Ardene plaid scarves $19.90 | $19.99 | At market |
| Novelty socks | Ardene 2-pack knee socks $7.90, boot socks $9.90 | $5.99 to $7.99 per pair, with 20 to 30 % multi-buy | Bundle engine drives units per order |
| Mini bags | Mall minis about $25 to $40 | $24.99 to $32.99 | Value tier; revisit after reshoot |
| Pyjama sets (Turkish brand) | Mall pyjama sets about $40 to $60 | $44.99 | Branded import |
| Pop-up ear bunny hat | Ardene earmuffs $14.90 | $19.99 | Novelty and gift value |

Rules:
- All prices end in .99 and are stored as integer cents.
- **Margin guardrail:** landed cost (unit cost + freight + duty) must be ≤ 35 % of price. The owner enters `unitCostCents` per product in Studio (private field, never sent to the client); the Studio shows a margin badge and warns under 60 % gross margin.
- `compareAtPriceCents` stays null unless the item really sold at that price for a meaningful period (Competition Act; §12).
- Payment fees for reference: Stripe Canada domestic cards 2.9 % + 30¢.

### 7.3 Automatic promotions (from `products.json` → `promotions`)
| ID | Rule | Notes |
|---|---|---|
| `socks-mix-match` | Ankle and crew socks: 3+ pairs 20 % off, 6+ pairs 30 % off the sock subtotal | Tier picked by total sock quantity across variants |
| `earrings-b2g1` | Earrings: for every 3 eligible units, the cheapest is free | Mystery Trio excluded (`excludedFromPromotions`) |

### 7.4 Promo codes
`WELCOME10`: 10 % off the merchandise subtotal **after** automatic promotions; one use per email (checked against paid orders); issued after newsletter sign-up. Codes are managed in Sanity (`promoCode` documents) and validated server-side. Do not use Stripe promotion codes (see §9.2 for why).

### 7.5 Shipping (Canada only)
| Method | Price | ETA | Free? |
|---|---|---|---|
| Standard (Canada Post, tracked) | $8.99 | 3 to 7 business days | Free when the post-discount merchandise subtotal is ≥ $60.00 |
| Expedited (Canada Post, tracked) | $15.99 | 2 to 4 business days | Never |
| Local pickup | $0 | 1 to 2 business days | Disabled by default; owner toggles and sets the address in Studio |

All values live in Sanity `siteSettings` (seeded from `products.json` → `shipping`).

### 7.6 Sales tax
Canadian prices are shown tax-exclusive. Two modes via env `TAX_MODE`:
- `none` (default): for a **small supplier** (under $30,000 in taxable sales over four consecutive calendar quarters), which isn't required to register for GST/HST and must not charge it. No tax lines; copy says "Shipping calculated at checkout".
- `table`: once registered, tax is calculated by **our own pricing engine** from a per-province table kept in Sanity `siteSettings` (no Stripe Tax). Each province has one or more components (`GST`, `HST`, `PST`, `RST`, `QST`), each with a rate and its own **applies to shipping** flag, editable by the owner. Tax is calculated on the **discounted merchandise subtotal** (after automatic promotions and codes), plus shipping where the component's flag is on, **rounded per component to the cent**. The province comes from the shipping address. Copy becomes "Shipping and taxes calculated at checkout". Receipts and order emails show the `GST_HST_NUMBER` when set; the launch check fails if `TAX_MODE=table` and it is empty.

Seed table (2026): AB 5 GST · BC 5 GST + 7 PST · MB 5 GST + 7 RST · NB 15 HST · NL 15 HST · NS 14 HST · NT 5 GST · NU 5 GST · ON 13 HST · PE 15 HST · QC 5 GST + 9.975 QST · SK 5 GST + 6 PST · YT 5 GST. All components apply to shipping by default (delivery charges on taxable goods are taxable); the owner can switch that per component. The engine does not model product-specific exemptions (for example some provincial PST exemptions for children's clothing); the owner confirms registration obligations, exemptions and PST/QST thresholds with an accountant.

## 8. Technical architecture

### 8.1 Stack (use latest stable versions; check with `npm view <pkg> version`)
| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript `strict` | Server components, static generation and image optimisation |
| Styling | Tailwind CSS v4 with CSS-first `@theme` tokens | Tokens from §4 in one place |
| UI primitives | Radix UI primitives (via shadcn/ui CLI is fine) **fully restyled** | Accessibility for dialogs, menus and accordions |
| Motion | `motion` | Spec in §4.7 |
| Cart state | Zustand with `persist` (localStorage, guarded) | Small, fast |
| Validation | Zod | API inputs, env, catalogue import |
| CMS | Sanity: Content Lake plus Studio embedded at `/studio`, `next-sanity`, `@sanity/image-url`, Sanity TypeGen | Owner-editable products, content, settings, tax table, and non-personal order documents |
| Payments | Stripe **PaymentIntents** with the Payment Element and Express Checkout Element (`@stripe/stripe-js`, `@stripe/react-stripe-js`), Stripe Node SDK | Stripe is used **only for payment**: PCI handled by Stripe's iframes; Apple Pay and Google Pay; CAD. Tax, shipping and discounts are ours |
| Accounts | Firebase Auth (email + password, email link, optional Google) with **session cookies** via `firebase-admin` | Customer accounts; the client SDK is used only for sign-in UI flows |
| Private data | Firestore (profiles, addresses, carts, customer side of orders), `firebase-admin` on the server only, security rules tested with the emulator | The private store for everything personal (§9.8) |
| Email | Resend plus React Email | Order, shipping, contact and account emails (verification, password reset and sign-in links are generated with the Admin SDK and sent by us, so no default Firebase emails go out); newsletter topic and segment |
| Hosting | Vercel | Native Next.js; preview deploys |
| Analytics | Vercel Analytics (cookieless) | No consent banner needed |
| Tests | Vitest (unit), `@firebase/rules-unit-testing` with the Firestore emulator (rules), Playwright (e2e with the Firebase emulators, and screenshots), axe-core (accessibility) | §14 |
| Quality | ESLint, Prettier, `tsc --noEmit` in CI | |

### 8.2 Data-source adapter (critical for speed)
All storefront reads go through `lib/data/index.ts`, which exposes typed functions (`getProducts`, `getProductBySlug`, `getDepartments`, `getCategory`, `getCollection`, `searchProducts`, `getSiteSettings`, `getHomePage`, `getPage`, `getVariantsBySku`).
- `DATA_SOURCE=local` (default when Sanity env vars are missing): reads `catalog/products.json`; images served from `/public/catalog/images` (copied by a `predev`/`prebuild` script). The whole storefront works with no accounts.
- `DATA_SOURCE=sanity`: GROQ queries through `next-sanity`, cached with tags (`product`, `product:<slug>`, `settings`, and so on) and revalidated by the Sanity webhook (§8.5).
- Both adapters return identical TypeScript types (`lib/data/types.ts`). Write contract tests that run the same assertions against the local adapter.

### 8.3 Folder structure
```
app/
  (store)/layout.tsx, page.tsx
  (store)/shop/[[...segments]]/page.tsx      # /shop, /shop/[dept], /shop/[dept]/[cat]
  (store)/collections/[slug]/page.tsx
  (store)/products/[slug]/page.tsx
  (store)/search/page.tsx
  (store)/bag/page.tsx
  (store)/checkout/page.tsx                  # our one-page checkout
  (store)/checkout/success/page.tsx
  (store)/account/(public)/{sign-in,sign-up,forgot-password,action}/page.tsx
  (store)/account/(private)/{page,orders,addresses,profile,preferences}/...
  (store)/order-status/page.tsx
  (store)/[page]/page.tsx                    # about, faq, privacy, and so on
  studio/[[...tool]]/page.tsx
  api/quote/route.ts                         # POST cart -> priced quote
  api/checkout/session/route.ts              # POST create or update pending order + PaymentIntent, returns quote
  api/checkout/quote/route.ts                # POST re-quote (address, method, code)
  api/auth/{signup,session,email-link,password-reset}/route.ts
  api/account/{profile,addresses,orders,cart,preferences,password,delete}/route.ts
  api/stripe/webhook/route.ts
  api/revalidate/route.ts                    # Sanity webhook
  api/newsletter/route.ts
  api/contact/route.ts
  api/order-status/route.ts
  api/admin/ship-order/route.ts              # called by a Studio document action
  api/admin/order-customer/route.ts          # Studio Customer panel (Firestore, falls back to Stripe)
  sitemap.ts, robots.ts, opengraph-image.tsx, not-found.tsx, error.tsx
components/{ui,layout,product,cart,home,listing,content}/
lib/
  data/{index.ts,local.ts,sanity.ts,types.ts,queries.ts}
  pricing/{engine.ts,engine.test.ts,types.ts}
  stripe.ts, env.ts (Zod-validated), format.ts (Intl en-CA CAD), seo.ts, rate-limit.ts
  firebase/{admin.ts,client.ts}, auth/session.ts, geo.ts (provinces, postal codes), orders.ts, customer-orders.ts
  email/{send.ts,templates/*.tsx}
sanity/
  sanity.config.ts, structure.ts, schemaTypes/*, actions/markShipped.ts, components/*
scripts/
  copy-catalog-images.ts, seed-sanity.ts, setup-resend.ts, check-launch.ts, screenshots.ts
firestore.rules, firestore.indexes.json, firebase.json   # rules, indexes, emulator config
e2e/*.spec.ts
catalog/ (provided)
CLAUDE.md
```

### 8.4 Environment variables (`.env.example`, validated by `lib/env.ts`)
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATA_SOURCE=local                     # local | sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-10-01
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=               # server only: seed, orders, stock
SANITY_REVALIDATE_SECRET=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_AUTH_GOOGLE=              # 1 turns on "Continue with Google" (also enable it in the Firebase console)
FIREBASE_ADMIN_PROJECT_ID=            # server only
FIREBASE_ADMIN_CLIENT_EMAIL=          # server only
FIREBASE_ADMIN_PRIVATE_KEY=           # server only; paste with literal \n, they are unescaped
TAX_MODE=none                         # none | table
GST_HST_NUMBER=                       # shown on receipts; required when TAX_MODE=table
RESEND_API_KEY=
RESEND_NEWSLETTER_TOPIC_ID=           # created by `npm run setup:resend`
RESEND_NEWSLETTER_SEGMENT_ID=         # created by `npm run setup:resend`
EMAIL_FROM="Glint & Thread <orders@example.ca>"
OWNER_EMAIL=
EMAIL_HASH_SALT=                      # long random string, server only
DEV_DEFAULT_STOCK=10
```
Behaviour without keys: no Stripe keys → `/checkout` shows "Checkout opens soon" and the checkout API returns 503; no Firebase keys → account links and pages are hidden and guest checkout still works (customer details then live only on the Stripe PaymentIntent); no Resend key → emails are logged to the console; no Sanity write token → orders are not stored. For local development and tests, the Firebase emulators are used through the standard `FIREBASE_AUTH_EMULATOR_HOST` and `FIRESTORE_EMULATOR_HOST` variables (plus `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` for the browser).

### 8.5 Caching and revalidation
- Listing and product pages are statically generated (`generateStaticParams` from the adapter) and revalidated on demand.
- Sanity webhook (on create, update and delete of product, category, collection, settings, page and homePage) → `POST /api/revalidate` with a signature check (`next-sanity/webhook` `parseBody`) → `revalidateTag` for the affected tags.
- Stock-sensitive UI (the "Only 3 left" note and sold-out state) reads fresh at quote and checkout time; the page can be slightly stale, but checkout never is.

## 9. Commerce logic

### 9.1 Pricing engine (`lib/pricing/engine.ts`, pure, framework-free, fully unit-tested)
**Input:** `lines: {sku, qty}[]`, `promoCode?`, `email?`, `province?`, `shippingMethodId?`, canonical catalogue data (prices, categories, exclusions, stock), active promotions, promo codes, shipping settings, `taxMode` and the tax table.
**Output:**
```ts
type Quote = {
  lines: { sku; productSlug; title; variantTitle; qty; unitPriceCents; lineSubtotalCents;
           discountCents; promotionIds: string[]; available: number | null; image }[];
  merchandiseSubtotalCents: number;      // before discounts
  automaticDiscountCents: number;        // sum of promotions
  codeDiscountCents: number;             // promo code, applied after automatic
  discountedSubtotalCents: number;
  shippingOptions: { id; label; amountCents; eta; isFree: boolean }[];
  shipping: { id; label; amountCents; isFree } | null;   // the selected method (null until chosen)
  taxMode: 'none' | 'table';
  taxLines: { code; label; ratePercent; amountCents }[]; // empty when TAX_MODE=none or no province yet
  taxCents: number;
  totalCents: number;                    // discounted subtotal + shipping + tax
  freeShipping: { thresholdCents; remainingCents; unlocked: boolean };
  messages: { type: 'info'|'warning'|'error'; text: string; sku?: string }[];  // e.g. stock reduced
};
```
**Rules:**
1. Unknown or inactive SKUs are dropped with a warning message. Quantities are clamped to 1 to 10 per line and to available stock.
2. Integer cents only. Percentage discounts: `Math.round(baseCents * pct / 100)`.
3. `tiered_percent_category`: sum the eligible units' subtotal; apply the highest tier whose `minQty` ≤ eligible quantity; allocate the discount back to lines proportionally (the last line absorbs rounding).
4. `buy_x_get_y_cheapest_free`: expand eligible units, sort by unit price ascending, free units = `floor(n / (buyQty + getQty)) * getQty`, take the cheapest; allocate to their lines.
5. A unit receives at most one automatic promotion. Excluded products get none.
6. Promo code applies to `merchandise − automatic` on non-excluded lines; validate active flag, first-order-only (no paid order with that email and code), and expiry.
7. Free shipping uses `discountedSubtotalCents` against the threshold.
8. Tax (`taxMode: 'table'` and a known province): for each component of the province, base = `discountedSubtotalCents` (+ the selected shipping amount when the component applies to shipping), `amount = Math.round(base * rate / 100)` computed in integers (rates carry up to three decimals, for example 9.975), rounded per component. `taxCents` is the sum of the components; `totalCents = discountedSubtotalCents + shipping + taxCents`. Unknown province or `taxMode: 'none'` gives no tax lines.
9. Tax labels: GST is "GST 5%"; HST, PST, RST and QST carry the province, for example "HST (ON) 13%", "PST (BC) 7%", "QST (QC) 9.975%".

**Required unit tests (exact expectations):**
| Case | Expected |
|---|---|
| 3 × sock $6.99 | subtotal 2097, discount 419, discounted 1678 |
| 3 × $5.99 + 3 × $7.99 socks | subtotal 4194, discount 1258 (30 %), discounted 2936 |
| 2 × sock $6.99 | no discount |
| Earrings $9.99, $12.99, $14.99 | discount 999 (cheapest free), discounted 2798 |
| 4 earrings ($9.99 × 4) | 1 free → discount 999 |
| 6 earrings | 2 cheapest free |
| Mystery Trio + 2 earrings | Trio not counted; no free unit |
| $70 cart + WELCOME10 | code discount 10 % of post-automatic subtotal |
| Discounted subtotal $59.99 | standard shipping 899, remaining 1 cent |
| Discounted subtotal $60.00 | standard shipping 0, unlocked |
| Requested qty 5, stock 2 | qty clamped to 2 + warning |
| One order to each of the 13 provinces and territories, with and without shipping tax | exact cents per component and total (see tests) |
| 3 socks in ON with WELCOME10 | tax on the discounted subtotal after the code |
| Free-shipping order in BC | PST and GST on merchandise only (shipping is $0) |

### 9.2 Checkout session (`POST /api/checkout/session`)
1. Rate-limit by IP (30 per minute; in-memory LRU is acceptable for v1).
2. Zod-validate `{ lines, promoCode?, email, address?, shippingMethodId?, createAccount?, session? }`. Never accept prices or totals from the client.
3. Build the quote from canonical data, including the province and the selected shipping method (§9.1). Abort with a friendly 409 if any line is unavailable or clamped.
4. **First call** (no `session`): create the **pending order** in Sanity (non-personal: order number `GT-` + 6 base32 characters, lines, quote snapshot, amounts and tax lines, `shippingProvince`, `emailHash`, `status: 'pending'`) and the private `customerOrders/{id}` document in Firestore (§10.1), then create a **PaymentIntent**: `currency: 'cad'`, `amount` = the quote total, `automatic_payment_methods: { enabled: true }`, `metadata: { orderId, orderNumber }`, `receipt_email`, and `shipping` (name, phone, address) once known. Return `{ clientSecret, session: { orderId, paymentIntentId, token }, quote }`; `token` is an HMAC over the order and PaymentIntent IDs.
5. **Later calls** (address, shipping method, code, email or bag changed) carry `session`: verify the token, check the order is still `pending` and the PaymentIntent has not succeeded, re-quote, **update the PaymentIntent amount**, shipping and `receipt_email`, update the pending Sanity order and the Firestore document, and return the new quote. The client then calls `elements.fetchUpdates()`.
6. The client confirms with `stripe.confirmPayment({ elements, confirmParams: { return_url } })`, where `return_url` is `{SITE}/checkout/success?order={orderNumber}`.
7. Stock and prices are re-checked at PaymentIntent creation (step 3), on every update, and again in the webhook (§9.3). With no Stripe keys the route returns 503.
8. The hosted Checkout Session and the one-off coupon are not used.

### 9.3 Webhook (`POST /api/stripe/webhook`)
- Verify the signature with the raw body. Store processed `event.id`s on the order to stay idempotent.
- `payment_intent.succeeded`: confirm `amount_received` equals the order total (else set `needsReview`), set the order to `paid`; save the shipping method and amount, tax lines, totals, the shipping province and the Stripe IDs (no customer name, email, phone or address in Sanity: see §9.8); mirror the status to `customerOrders`; **decrement stock** per variant using Sanity patches with `dec`, guarded by an `order.stockDecremented` flag. If any stock goes below 0, set `needsReview: true` and email the owner. Send the order confirmation email (customer details come from Firestore, or from the PaymentIntent when Firebase is not configured). If the customer ticked "Create an account", send the account-setup email. Link the order to the customer's account when the buyer is signed in or has a verified account with the same email.
- `payment_intent.payment_failed`: record the failure code on the order (status stays `pending`; no stock change; no customer email).
- `payment_intent.canceled`: set `expired` (no stock change).
- `charge.refunded`: set `refunded` or `partially_refunded` (matched through the PaymentIntent); the owner decides on restocking manually.
- Return 400 only on a bad signature; return 200 for handled and unexpected events (logged); return **500 when processing a handled event fails, so Stripe retries** (handlers are idempotent on `event.id`).

### 9.4 Order lifecycle and fulfilment
`pending → paid → shipped → delivered` (plus `expired`, `cancelled`, `refunded`, `partially_refunded`).
Studio document action **"Mark as shipped"** asks for carrier (default Canada Post) and tracking number, then calls `/api/admin/ship-order` with the logged-in Studio user's Sanity token (verified server-side, §9.8), which updates the order and its `customerOrders` mirror (status and tracking show in the customer's account), reads the customer's email from Firestore (or the PaymentIntent) and sends the shipping email with a tracking link. The order form also shows a **Customer panel** (name, email, phone, address loaded live from Firestore `customerOrders` by `sanityOrderId` through `/api/admin/order-customer`, same auth, falling back to the Stripe PaymentIntent) and an "Open in Stripe" link. The Studio desk structure gives Orders their own section with filtered lists: Needs review, To ship, Shipped, All.

### 9.5 Inventory
- Stock lives on each variant. `null` is untracked (development only). At launch every variant needs a number.
- Low stock threshold is 3 (site setting). Sold-out variants stay visible but disabled; fully sold-out products sink to the end of listings and get the "Sold out" label.
- No stock reservation during checkout in v1 (oversells are flagged per §9.3).

### 9.6 Emails (React Email, styled to match the brand: dark header band, serif wordmark, bone body)
1. **Order confirmation:** order number, items with thumbnails, totals with each tax line by name and the GST/HST number when set, shipping address, delivery estimate, help link.
2. **Shipping notification:** carrier, tracking link, items.
3. **Owner new-order alert:** a plain summary with a Studio link.
4. **Contact form** to the owner (reply-to set to the customer).
5. **Newsletter welcome** with the WELCOME10 code.
6. **Account emails** (generated with the Admin SDK, branded, sent through Resend): verify email, reset password, sign-in link, and "finish setting up your account" for guests who ticked Create an account. Links point to our own `/account/action` page.
Every marketing email carries sender identification, a mailing address and a one-click unsubscribe (CASL).

### 9.8 Customer data and privacy (non-negotiable)
Sanity's free plan only offers **public** datasets: anything stored there can be read by anyone who knows the project ID. So:
- **No personal data in Sanity.** Customer names, emails, phone numbers, addresses and newsletter subscribers never go into Sanity documents.
- **Firestore is the private store** for profiles, addresses, carts and the customer side of orders (`customerOrders`). Access is by the Admin SDK on the server and by the signed-in customer under Firestore security rules (§10.1). **Resend** holds newsletter contacts. **Stripe** holds payment data and receives the shipping details and receipt email on the PaymentIntent (for payment and fraud checks); it is also the fallback source when Firebase is not configured.
- Orders in Sanity hold only the order number, line snapshot, amounts and tax lines, status, shipping province, tracking, Stripe IDs and `emailHash` (salted SHA-256 with a server-only `EMAIL_HASH_SALT`).
- Confirmation and shipping emails read the customer's details from Firestore (or the PaymentIntent) at send time.
- Admin routes (`/api/admin/*`) authenticate the Studio user: the Studio sends the user's Sanity session token, and the server verifies it against the Sanity API (`/users/me`) and checks project membership. No shared secrets in Studio code.
- **Account deletion (PIPEDA):** "Delete my account" removes the Firebase Auth user, the profile, addresses and cart, unsubscribes and removes the Resend contact, **anonymises** the customer's `customerOrders` (name, email, phone and address removed; order number, lines, totals, tax and dates kept because tax law requires sales records) and clears `emailHash` on the matching Sanity orders.
- If the business later moves to a Sanity plan with private datasets, this can be revisited and documented in DECISIONS.md.

### 9.7 Newsletter (CASL)
Form: email plus an **unchecked** consent checkbox: "Yes, email me about new drops and offers from Glint & Thread. Unsubscribe anytime." Resend replaced Audiences with global Contacts, Segments, Topics and Properties. On confirmed opt-in the contact gets the consent properties (`consent_text_version`, `consent_at`, `signup_source`, `confirmed_at`), is subscribed to the **Newsletter topic** and added to the **Newsletter subscribers segment** (`npm run setup:resend` creates them and prints the IDs); unsubscribing sets the topic to opt-out. Never store subscribers in Sanity (§9.8). Double opt-in is on by default via a confirm link. The code is shown after confirmation. Signed-in customers manage the same subscription on `/account/preferences`.

### 9.9 Customer accounts (Firebase)
- **Auth:** email + password, passwordless email link, and Google behind `NEXT_PUBLIC_AUTH_GOOGLE`. Email verification, password reset and sign-out. The server creates users and generates verification, reset and sign-in links with the Admin SDK and sends them through Resend with our templates; our `/account/action` page completes them with the client SDK (which is loaded on auth pages only). No FirebaseUI and no default Firebase styling or emails.
- **Session:** after sign-in the client posts its ID token to `/api/auth/session`, which exchanges it for a **Firebase session cookie** (`createSessionCookie`, 5-day expiry, `httpOnly`, `secure` in production, `sameSite=lax`) read with `verifySessionCookie` in server components and route handlers. Sign-out revokes refresh tokens and clears the cookie. A non-sensitive `gt_signed_in` hint cookie lets the client know to sync the cart without loading the Firebase SDK.
- **Pages:** overview; order history (list and detail with status, tracking, tax lines); saved addresses (add, edit, delete, default); profile (name, phone, password); marketing preferences; delete my account.
- **Cart:** a signed-in customer's bag is stored in Firestore (`users/{uid}/cart/current`) and merged with the local bag on sign-in (union of lines, larger quantity wins), so it follows them across devices.
- **Guest orders:** guest orders have `uid: null`. When someone later signs up (or signs in) and their email is **verified**, past guest orders with the same email are linked to the account. Guests who tick Create an account get a "finish setting up your account" email after payment.
- **Header:** shows Account (hidden when Firebase is not configured).
- Design: the same system as the rest of the site (§4), with the underline inputs and restyled controls.

## 10. Sanity data model (`sanity/schemaTypes`)
| Type | Key fields |
|---|---|
| `product` | title, slug, sku, status (active/draft/archived), department (ref), category (ref), price (number, cents; the Studio input shows dollars), compareAtPrice, unitCost (hidden from the API projection), shortDescription, description (Portable Text), details (string[]), careGuide (ref), optionNames (string[]), variants (array of `variant`), images (array of image with alt, required, hotspot), tags (string[]), featured (bool), excludedFromPromotions (bool), photoNote, verify (string[]), seo (title, description) |
| `variant` (object) | title, sku, options (key/value array), price override (cents), stock (number or empty), image (optional) |
| `department` | title, slug, order, blurb, heroImage, editorialTile (image + line) |
| `category` | title, slug, department (ref), order, blurb |
| `collection` | title, slug, mode (rule/manual), rule (tags[], maxPrice, departments[]), products (refs), heroImage, blurb |
| `promotion` | title, type (`tiered_percent_category` / `buy_x_get_y_cheapest_free`), active, appliesTo (categories refs, exclude product refs), tiers[] or buyQty/getQty, badge text, startsAt/endsAt |
| `promoCode` | code (uppercase, unique), type (`percent_off_order`), percentOff, firstOrderOnly, active, expiresAt, note |
| `order` | orderNumber, status, lines (snapshot), amounts (subtotal, discounts, shipping, tax, total), taxLines (code, label, rate, amount), shippingProvince, emailHash (SHA-256 of the lowercased email, for first-order code checks and order-status lookup), shippingMethod, carrier, trackingNumber, stripe IDs, processedEventIds[], stockDecremented, needsReview, notes, timestamps |
| `careGuide` | title, slug, body (Portable Text); seed jewellery-care, textile-care, bag-care, tool-care |
| `page` | title, slug, body (Portable Text), seo |
| `homePage` (singleton) | announcement messages[], hero (eyebrow, headline, italic tail, sub, image, CTAs), edit products, department mosaic order, brand band, spotlight collection, offers band, story block, newsletter copy |
| `siteSettings` (singleton) | store name, legal name, business address, contact email, shipping methods and threshold, **tax table** (per province: components with code, rate and applies-to-shipping flag), low-stock threshold, returns policy summary, social links, default SEO, footer sign-off |

### 10.1 Firestore data model (private store, §9.8)
| Path | Fields |
|---|---|
| `users/{uid}` | firstName, lastName, phone, marketingOptIn (+ consent record), createdAt |
| `users/{uid}/addresses/{id}` | label, name, line1, line2, city, province, postalCode, phone, isDefault |
| `users/{uid}/cart/current` | lines (sku, qty, snapshot), promoCode, updatedAt |
| `customerOrders/{orderId}` | sanityOrderId, orderNumber, uid (nullable), email, name, phone, shippingAddress, stripePaymentIntentId, status, totals (with tax lines), lines (snapshot), carrier and trackingNumber, createdAt |

`firestore.rules`: a signed-in user can read and write only their own `users/{uid}` tree (with field and size validation); `customerOrders` are readable only by the owning `uid` and **never writable from the client** (the server writes them with the Admin SDK); everything else is denied. `firestore.indexes.json` carries the indexes the queries need. Rules are unit-tested with `@firebase/rules-unit-testing` against the Firestore emulator, and deployed with `npm run deploy:rules`.

Studio niceties: a custom price input (dollars ↔ cents), a margin badge on the product form, a "Needs attention" list (products with `verify` items, missing stock, `photoNote`), previews with images, and singletons pinned in the desk structure.

**Seed script** (`scripts/seed-sanity.ts`): idempotent (deterministic `_id`s like `product-<slug>`), uploads images (Sanity dedupes identical files), creates departments, categories, care guides, collections, promotions, promo codes, settings, homePage and pages with the default copy, products with variants. Supports `--dry-run`.

## 11. Default content to seed

### 11.1 Shipping & returns (summary; full page in Sanity)
- We ship across Canada only. Orders leave within 1 to 2 business days.
- Standard tracked shipping $8.99, free on orders over $60 (after discounts). Expedited $15.99.
- Returns within 30 days of delivery for unworn items in original packaging. Refunds go to the original payment method once the item is received.
- **Final sale** (hygiene): earrings and ear cuffs, the Mystery Trio, hair ties, beauty tools (razors, sponges, curlers), and anything marked final sale.
- Damaged or wrong item? Email within 7 days with a photo; we fix it at our cost.

### 11.2 Care guides
- **Jewellery:** Pieces are gold-tone or silver-tone plating over base metal unless the listing says stainless steel. Keep them dry: remove before showering, swimming or working out. Apply perfume and lotion first, jewellery last. Store pieces separately in a pouch or box to avoid scratches. Wipe with a soft dry cloth after wearing. Stainless steel is more durable but still loves a dry cloth.
- **Textiles:** Follow the care label. Wash cold, inside out, with similar colours; reshape and lay flat to dry; no tumble drying for berets, scarves and caps.
- **Bags:** Wipe with a damp cloth; keep away from heat and direct sun; stuff with paper to hold the shape.
- **Tools:** Clean after each use; replace sponges every 1 to 3 months; never share razors.

### 11.3 FAQ (starter)
Is your jewellery real gold? (No: gold-tone plating over base metal unless stated stainless steel; priced accordingly.) · Will it turn my skin green? (Honest answer plus care tips.) · Where do you ship? · How long does shipping take? · Can I return earrings? · Do you charge sales tax? (Depends on `TAX_MODE`; seed the `none` version with an `[[UPDATE IF REGISTERED]]` marker.) · How do I use WELCOME10? · Do you restock? (Small batches: sometimes, not always.)

### 11.4 About (placeholder structure)
H1 "Small batches, honestly made to shine." Then three short sections: who we are `[[OWNER_STORY]]`, how we choose pieces, our honesty promise (tone words, no fake reviews, no fake sales). One line: "Our initials are G&T. Yes, we know."

## 12. Canadian compliance (build it in; the owner confirms the legal details)
1. **Precious Metals Marking Act:** never describe plated items as gold or silver; use the tone words. Only say "stainless steel" where the packaging confirms it.
2. **Competition Act:** no invented "was" prices; no drip pricing (all mandatory fees visible before payment, and with `TAX_MODE=table` every tax line shown by name before the customer pays); no fake reviews or urgency.
   **Sales tax:** charge GST/HST/PST/QST only once registered (`TAX_MODE=table`) and show the registration number on receipts.
3. **Textile Labelling and Advertising Regulations:** consumer textile articles (socks, scarves, hats, pyjamas, leggings, headbands) need bilingual labels with fibre content and dealer identity. Listings show fibre content where known. Products with an unverified fibre `verify` item are flagged in Studio.
4. **CASL:** express opt-in, unchecked box (sign-up, checkout and preferences), consent record, sender ID, mailing address and unsubscribe in every commercial email. Account and order emails are transactional.
5. **PIPEDA privacy policy:** what is collected (account, order, contact and newsletter data), why, processors (Stripe, Google Firebase, Sanity, Resend, Vercel), retention, access and deletion requests (self-service account deletion, §9.8), contact. No third-party ad trackers in v1. Sales records are kept as tax law requires.
6. **Quebec (Charter of the French Language):** v1 is English. All UI strings live in `messages/en-CA.json` through a tiny `t()` helper so `fr-CA` can be added. Before marketing to Quebec, add French.
7. **Accessibility:** WCAG 2.1 AA target, plus an accessibility statement page.
8. **Children's items** (bunny hat, cherry hair ties, mini elastics): no small-parts claims; warn "Not suitable for children under 3" where relevant until verified.
9. **Hygiene final-sale** items declared clearly before purchase on the PDP.

## 13. SEO, performance, accessibility, security

**SEO:** per-page `generateMetadata` (title template `%s | Glint & Thread`), canonical URLs, Open Graph images (product image on the mat, generated via `opengraph-image.tsx` for collections), JSON-LD (`Organization`, `WebSite` with SearchAction, `Product`, `BreadcrumbList`, `FAQPage`), `sitemap.ts` covering products, categories, collections and pages, and `robots.ts` disallowing `/studio`, `/api`, `/bag`, `/checkout`, `/account`. Clean slugs. `alt` text required in the CMS.

**Performance:** server components by default; client components only for interactive islands (bag, selectors, filters, menus). No client-side data fetching for first paint. Fonts self-hosted via `next/font`. Images through `next/image` with exact `sizes`. JS budget: under 150 KB gzipped first-load on the PDP. Remove unused Radix packages. No carousels heavier than CSS scroll-snap.

**Accessibility:** semantic landmarks, skip link, visible focus (`champagne-400` 2 px outline, offset 2 px), keyboard support for all menus, drawers, galleries and the zoom viewer; `aria-live` for bag updates; reduced motion; form labels and errors linked by `aria-describedby`; colour never the only signal (variant chips have text); axe-core with zero serious or critical issues.

**Security:** Zod on every input; server-only tokens and `firebase-admin` never imported in client code (`server-only` package); Firebase session cookies (`httpOnly`, `secure`, `sameSite=lax`) verified server-side, with fresh sign-in required for password change and account deletion; Firestore security rules (§10.1) tested in CI; webhook signature checks (Stripe, Sanity); amounts are never trusted from the client (PaymentIntent amounts are set by the server); admin API routes authenticate the Studio user's Sanity token (never a shared secret bundled into Studio code); rate limits on checkout, auth, newsletter, contact and order-status; honeypot on forms; security headers (CSP allowing Stripe, Firebase Auth and Sanity domains, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`); the order-status lookup requires order number + email (matched via `emailHash`) and returns status and tracking only.

## 14. Definition of done

### 14.1 Functional
- [ ] Every route in §5.3 renders with real catalogue data in `local` mode and in `sanity` mode.
- [ ] Filters, sort, search, quick add, variant selection, bag drawer, promo code and free-shipping progress all work.
- [ ] Stripe test purchase end to end on `/checkout`: pending order → PaymentIntent → paid → stock decremented → confirmation email (or console log) → "Mark as shipped" → shipping email. Test cards: `4242 4242 4242 4242` succeeds, `4000 0027 6000 3184` requires 3-D Secure, `4000 0000 0000 0002` is declined.
- [ ] Accounts: sign up → verify → checkout with a saved address → the order appears in `/account`; guest orders link after verification; delete account anonymises orders.
- [ ] Failed, cancelled and refunded PaymentIntent webhooks update the order correctly; replaying a webhook is a no-op.
- [ ] Pricing engine tests in §9.1 pass (including tax for every province); Firestore rules tests pass against the emulator; `tsc`, ESLint and Vitest are clean.

### 14.2 Design QA loop (mandatory, at least two passes)
1. `npm run shots` (Playwright) captures Home, Jewellery department, Earrings category, a single-variant PDP (`oversized-open-heart-earrings`), a multi-option PDP (`suede-touch-pyjama-set`), bag drawer open with a sock bundle and earrings, search overlay, mobile menu, 404, About, **checkout** (all three sections), **account** pages and the **auth** pages, at 390, 768, 1280 and 1440 px (full-page) into `/screenshots/<pass>/`.
2. Open every screenshot and review it against §4 (tokens, type, mats, spacing, anti-template rules, responsive rules). Write the findings to `screenshots/<pass>/REVIEW.md` as a checklist.
3. Fix everything, re-shoot, re-review. Stop when a pass finds nothing above "nitpick".
- [ ] Lighthouse mobile thresholds from §2 met on Home, Earrings and PDP.
- [ ] axe: zero serious or critical issues on the same pages.

### 14.3 Launch gate (`npm run check:launch` must pass)
Fails if: any variant has `stock` null; any `[[PLACEHOLDER]]` remains in pages or settings; legal name, address or contact email are missing; `STRIPE_SECRET_KEY` or the publishable key is a test key (or `STRIPE_WEBHOOK_SECRET` is unset) while `NODE_ENV=production`; `NEXT_PUBLIC_SITE_URL` is localhost; the Sanity webhook secret is unset; any product image lacks alt text; `EMAIL_HASH_SALT` is missing or the development default in production; any other env var still points at test, sandbox or local values in production (for example `onboarding@resend.dev`, Firebase emulator hosts); `TAX_MODE=table` with an empty `GST_HST_NUMBER`; Firebase is only partly configured, or the Firestore rules file differs from the deployed rules marker. Warns (doesn't fail) on `photoNote` and unresolved `verify` items, listing them.

## 15. Owner inputs still needed
1. **Stock counts** per variant (fill `catalog/catalog.csv` → "Stock" column, or enter in Studio).
2. **Unit costs** (to check the 35 % landed-cost guardrail).
3. **Verify items** listed per product (dimensions, fibre content, pack counts). The big ones: are the stainless pendants necklaces or threader earrings; bag materials, sizes and straps; sock fibre content.
4. **Reshoot** (priority: bags, Everyday Hoops, Figaro necklaces, ear cuff, pouches, bunny hats). Spec: matte black seamless backdrop (no glossy table reflections), soft diffused window light, phone on a tripod, 4:5 portrait, product filling about 70 % of the frame, unboxed, three shots per product (front, detail, on-body or in-hand for scale), ≥ 2000 px on the long edge, consistent white balance.
5. Legal business name, mailing address, contact email, domain, logo preference (the default is a typeset wordmark), and the About story.
6. GST/HST registration status (sets `TAX_MODE`) and the GST/HST number. With `table`, confirm each province's rates and the applies-to-shipping flags with an accountant.
7. A **Firebase project** (Auth with email/password, email link and optionally Google enabled; Firestore in a Canadian region such as `northamerica-northeast1`; a service account for the Admin SDK) owned by the business. The build team transfers ownership at handover (see PROMPTS.md).
8. Stripe account in the business's name: publishable and secret keys, and a webhook endpoint subscribed to `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled` and `charge.refunded`.

## 16. After launch (v2 backlog)
French (`fr-CA`), wishlists synced to the account, back-in-stock alerts, real reviews (post-purchase, verified only), gift wrap and notes, gift cards, Canada Post API live rates and label printing, US shipping, a lookbook, Instagram feed, abandoned-checkout emails (with consent).
