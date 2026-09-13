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

## Go to market

Goal: the first order on the site, then a repeatable source of them. Etsy
proves demand (66 sales); the site has no traffic source of its own yet, so
the work is sequencing channels, cheapest first.

### Status (2026-09-13)

`holderforge.com` serves the pre-catalog build from 2026-09-08: the storefront
routes 404 in production, `holderforge-api-prod` does not exist and no
`/holderforge/prod/*` parameters are set. The whole catalog and order flow
exist only on staging. Nothing below matters until the going-live checklist in
`docs/payments.md` is done. Also pending: ScentSplit changed its vial; the
19 mm row in `bottles.js` and the Etsy listing are stale, and a stale row
breaks the "never measure" premise on the first sale.

### Order of operations

1. Go live (checklist in `docs/payments.md`), place a real test order.
   Measure the new ScentSplit vial and add it as a second row; keep the old
   row for existing collections. The mixed-size product covers both.
2. Day one after live: Search Console with `sitemap.xml`, an analytics tag,
   a Google Merchant Center feed (free Shopping-tab listings; needs a contact
   page and returns policy), printed insert cards for Etsy boxes.
3. Week one: maker posts with real photos in the communities below; mail a
   finished holder to two decant sellers.
4. Week two onward, only if nothing has landed: a small exact-match Google
   Search campaign, run as a measurement, not a growth channel.

### Channels, cheapest per sale first

- **Etsy boxes.** Every shipment carries a card with the site and a discount
  code. Etsy's policy is about steering the transaction off-platform in
  listings and messages; a branded insert in the package is standard
  practice. Repeat buyers exist ("second organizer") and are the most likely
  first site customers.
- **Communities.** r/fragrance, r/Perfumes, r/DecantExchange, Fragrantica
  forums, fragrance Facebook groups; r/3Dprinting for the making side. Post
  as a maker showing the holder full of bottles with the brand list it fits;
  check each community's self-promotion rule first.
- **Decant sellers (ScentSplit, DecantX, similar).** Small shops; a referral
  link is no incentive. Offer wholesale so they list the holder as an
  accessory at their own margin, or a free holder full of their vials for
  their photos and newsletter. Send a finished unit with a one-page note, not
  an email. Expect most to ignore it; one yes is a channel.
- **Scentbird** is the largest US travel-spray audience with one standard
  vial and a real search term ("scentbird holder"). Measure one and add a
  brand page.
- **Google Merchant Center free listings.** Product feed generated from
  `products.js`.
- **Google Search ads, exact match only** ("scentsplit holder", "travel spray
  organizer", "perfume sample vial holder"). Low volume, high intent, cheap
  clicks. Budget on the order of USD 50-150 over a few weeks for one sale.
  Skip Meta ads: cold traffic for a niche organizer costs more per sale than
  the item until conversion rate is known.

### What ads do and do not do

Paid ads have no effect on organic ranking, and neither do sales. Early ad
spend buys two numbers: whether the product page converts and at what rate.
At USD 35, exact-match clicks well under a dollar and a conversion rate of a
few percent put cost per sale inside margin; a fraction of a percent rules
ads out. Either answer is worth the spend once.

### What ranks

One page per brand and size answering a query nobody else has a page for,
indexed and left alone. Organic Google is a 2-4 month bet, not a first-sale
plan; every measured bottle adds a page at zero marginal cost. Etsy cannot
make a per-brand page.

### Long-term role of the site

Etsy remains the discovery channel and the majority of sales for at least a
year. The site does three things Etsy cannot:

1. Own the long-tail brand and size pages.
2. Own the customer: email list, insert cards, repeat and referral.
3. Self-serve custom sizing through the finder and designer, where Etsy needs
   a message thread and a custom listing.

Per unit, USD 35 via Stripe nets about the same as USD 45 on Etsy without
offsite ads, so the site is not the higher-margin channel at current prices.
Its advantage is ownership and fit certainty, not price; do not price it far
below Etsy. Ads become a growth channel only when measured cost per sale sits
inside margin, which is why the conversion rate gets measured early.

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
