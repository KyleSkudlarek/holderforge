# Business context

Positioning, customers and channel facts that the code cannot express. Update
when a decision here changes; the Etsy numbers come from `docs/etsy/` and are
refreshed by `npm run etsy:pull`.

## What the business is

A one-person 3D-printing workshop in Austin, TX (PLA, sold under
"HolderForge" on the site and "SkudsWorkshop" on Etsy) making tiered holders
for cylindrical and rectangular containers that cosmetics ship in: travel
sprays, decants, fragrance samples, rollerballs, lipstick, mascara, concealer.

The differentiator is not the print. It is that the customer never measures a
bottle: they name the brand and the holder is already sized. That is the
premise behind the `bottles.js` table, the `/fits/<brand>` pages and the
bottle finder. Every product decision should preserve it.

Adjacent products under the same premise: supplement and vitamin bottle
holders (square, larger, countertop, "two weeks of grab-and-go" for people who
take many supplements). Same data model: brand, product, base dimensions.

## What the Etsy data says (snapshot 2026-09-13)

- Six active listings, all 15-slot / 3-tier, all USD 40-45. Sixty-six sales
  since November 2024, 24 reviews, 4.86 average.
- The brand-named listing (ScentSplit, 19 mm) produced 10 of 24 reviews despite
  the universal listing getting more views. Brand-specific titles convert.
- Two reviews describe a wrong-size purchase (one 3-star: too shallow, bottles
  tipped; one 5-star after a free replacement). Sizing errors are the main
  failure mode and the main support cost, which is the case for the finder.
- The makeup listing reuses cologne tags ("scentsplit bottle", "cologne
  sample"), so it competes with the fragrance listings instead of ranking for
  lipstick/mascara searches.
- The DecantX listing says in its own copy that it duplicates the universal
  listing. Brand-titled duplicates are the intended Etsy SEO tactic; the copy
  should not apologise for it.
- Review language worth reusing: sturdy, heavier than expected, vanity, fits
  where I need it, second organizer, custom sizing help was quick.

## Site pricing

Set 2026-09-13: 15-slot sample vial holder USD 30, every other 15-slot holder
USD 35 (Etsy stays at 40-45; the site is the higher-margin channel). Prices
live in `priceCents` in `src/catalog/products.js`.

## Channels

- Etsy is the discovery channel and carries the reviews. Etsy policy forbids
  steering buyers off-platform from listings or messages, so the site is
  never linked from Etsy copy; the site links to Etsy for social proof.
- The site is the long-tail SEO channel (brand and size pages) and the higher
  margin channel (Stripe instead of Etsy's listing, transaction, payment and
  offsite-ads fees).
- Reviews and product photos on Etsy are the seller's own content and can be
  reused on the site. Quote reviews with first name or initial only.

## Claims to keep accurate

- Brand names appear only as compatibility ("fits X travel spray"); the site
  states it is not affiliated with or endorsed by any brand.
- PLA is compostable only in industrial facilities. Say "plant-based PLA",
  not "biodegradable", on the site.
- PLA softens around 60 °C. A kitchen-counter supplement holder near a stove
  or in direct sun is the one use case where PETG is worth the print cost.

## Ideas not yet acted on

- An entry-price holder (5 or 8 slots) below USD 25 and a collector size (30+
  slots) above the current single 15-slot tier.
- One Etsy listing per top brand (Tom Ford, Jo Malone, YSL, Replica) at USD
  0.20 each, mirroring the site's brand pages.
- Deeper holes or a rear lip for tall travel sprays; the 3-star review is
  about depth, not diameter.
- Rename the Etsy shop to HolderForge so both channels carry one name.
- Outreach to decant sellers (ScentSplit, DecantX) as a referral channel;
  their customers are the exact buyer.
