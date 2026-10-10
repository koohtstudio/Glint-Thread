# Glint & Thread starter kit

Everything Claude Code needs to build the store: the spec, the prompts, and real product data.

| File | What it is |
|---|---|
| `PRD.md` | The full product requirements: brand, design system, pages, pricing engine, checkout, CMS schemas, Canadian compliance, definition of done |
| `PROMPTS.md` | The build prompts, in order. Prompt 1 builds most of the store in one run |
| `catalog/products.json` | 64 products, 179 variants, CAD prices, promotions, shipping and tax settings (Claude Code imports this) |
| `catalog/catalog.csv` | The same catalogue as a spreadsheet: review prices and fill in the **Stock** column |
| `catalog/images/` | 113 product images, auto-rotated, resized to 1600 px, location metadata stripped |

## Order of operations
1. Review `catalog/catalog.csv` (prices, names) and note the **To verify** column.
2. Follow **Prompt 0** in `PROMPTS.md`, then paste **Prompt 1** into Claude Code.
3. When Prompt 1 finishes, run the site locally and click around. No accounts are needed for this.
4. Prompts 2, 3 and 4: connect services, polish, launch.

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
