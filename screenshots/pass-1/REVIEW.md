# Design review, pass 1

Reviewed all 40 screenshots (10 views x 390, 768, 1280, 1440 px) against PRD section 4 as a creative director would.
Home, Jewellery, Earrings, both PDPs, 404 and About were read in slices at 1440 and 390; the 768 and 1280 widths
were read on Home plus the listing and PDP samples; bag drawer, search and menu at every width.

Severity: **A** = fix now (visibly wrong), **B** = fix now (polish a director would flag), **C** = nitpick or owner action.

## What works (keep)
- Dark gallery concept, tokens and the two type families read as one system. Serif headlines carry the pages.
- Mats unify photos taken on slightly different blacks; cards, search results, bag thumbnails all share the treatment.
- Asymmetric layouts: split hero, offset brand band, typographic offers band, left-aligned headings throughout.
- Announcement bar, header and sticky filter bar are quiet. Bag drawer totals, savings and free-shipping line are clear.
- No gradients, shadows, emoji, icon rows or fake social proof anywhere.

## Findings

### Home
- [A] **Hero crop cuts through earring cards** at the top and bottom (desktop 7/12 panel and the 768 4:3 crop). Looks accidental.
  Fix: choose the crop so cuts fall in the gaps between card rows (object-position about 29 percent) and give tablet a 16:15 frame.
- [A] **Jewellery department tile uses the hand-held hoops photo** (grey table, a thumb). Every other tile is a clean photo on black. Use the card group shot.
- [A] **Hats and Scarves tall tile has about 150 px of dead space** above and below a landscape image. Use the portrait beret stack so the tile is filled.
- [A] **Spotlight section is lopsided at 1440**: the image ends 600 px above the product grid, leaving a hollow on the left.
  Fix: image and copy as a pair on top, four products in one row beneath.
- [B] "This week's edit" opens with the hand-held hoops photo, the weakest image in the catalogue. Curate the eight from the featured set, best-photographed first.
- [B] Gifts row leads with a landscape keychain image that renders as a thin strip in its mat. Prefer portrait lead images.
- [B] Department tile at 390: "Charms & Keychains" wraps to three lines and "4 PIECES" collides with the tile border. Stack the count under the name on narrow tiles.
- [B] Newsletter form at 390 puts the full-width button above the consent checkbox. Order should be email, consent, button.
- [C] Brand band body copy is ragged; acceptable with text-wrap pretty.

### Listings
- [B] The count appears twice ("17 pieces" in the header and in the filter bar). Show the live count in the bar only when filters are active.
- [B] Editorial tile repeats the same image twice on Jewellery (after items 8 and 16), and its crop slices through card rows. Use each tile once and set a focal position.
- [C] Golden Hour Textured Hoops leads with a hand-held photo on every listing. Photo issue, logged for the owner reshoot.

### Product page
- [A] **Low-resolution first image sits in a huge empty mat** at 1440 (385 px photo in a 780 px mat). Obeys the never-upscale rule but reads as a loading failure.
  Fix: size the mat to the photo's natural width on desktop so it reads as a smaller framed print.
- [B] Final-sale products show two near-identical lines ("Final sale for hygiene reasons" and "Final sale. For hygiene reasons..."). Keep the PRD reassurance line verbatim and the single final-sale note.
- [C] Full-page capture shows the mobile sticky bar mid-page. Capture artefact only; hide it in full-page shots.

### Global
- [A] **Search field shows a boxed champagne ring** around an underline field, and a native bold clear (x) beside our own close button (overlay, mobile menu, 404, search page).
  Fix: suppress the native clear button, move the focus indication to the underline (champagne, 2 px) so focus stays visible.
- [A] **404 for unknown URLs renders without header or footer** (root not-found sits outside the store layout). Route unknown paths through the store 404.
- [B] Screenshot fixture for the bag drawer has blank thumbnails (no image in the stored line). Capture-script issue; fix so QA shows real thumbnails.
- [C] Mega menu panel is sparse between the category links and the tile. Intentional negative space; keep.

## Not changed (owner or data)
- Photography that is packaged or cropped (bags, mystery trio, pendants, hoops) is flagged in the catalogue `photoNote`; reshoot per PRD 15.
