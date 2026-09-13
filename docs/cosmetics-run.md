# Cosmetics measuring run

Plan for a Sephora/Ulta visit to measure the tubes the makeup holder should
be sold for. Nothing here goes into `src/catalog/bottles.js` until it has been
measured with calipers: the site's promise is that a buyer never measures,
so an estimated diameter that is 2 mm off produces exactly the wrong-size
review the finder exists to prevent. Every number below is an estimate from
packaging-industry norms and retailer listings, good enough to know what to
bring and where to look, not good enough to sell against.

## How to measure

- Digital calipers, phone notes, this list. Store testers are full-size
  packaging, so nothing needs to be bought.
- Measure the widest point of the part that sits in the hole: the bottom
  30 mm of the tube with the cap on, since tubes are stored capped and many
  caps are flush with or wider than the base. Record the cap width too if it
  is wider than the base; a cap wider than the hole still works (it rests on
  the rim) but changes the look.
- Square and rectangular tubes: measure both sides and note the corner
  radius. These need square holes in the designer.
- Record total height. The holder's hole depth must be deep enough that a
  top-heavy tube (mascara, liquid lipstick) does not tip; the one 3-star
  Etsy review is about depth, not diameter.
- Photograph each tester next to the calipers with the shelf label in frame.

Row format for `bottles.js` once measured (new `type` values are fine; add
them to `bottleTypes` and to the makeup category's `types`):

```js
b("Charlotte Tilbury", "Matte Revolution lipstick", "3.5g", "lipstick", 21, { measured: 20, height: 78 }),
```

## Categories worth a holder

Ranked by how many a person owns times how standardised the packaging is.
The first three are the ones to measure on this trip.

1. **Lipstick bullets** (round or square, 18-22 mm, 70-85 mm tall). The
   classic collection item; 5-20 owned is normal. Most round bullets are
   19-21 mm; luxury square ones (YSL, Dior, Tom Ford) need square holes.
2. **Lip and eye pencils** (wood 7.5-8 mm, mechanical 9-11 mm). Owned in
   quantity, tiny holes, so a 15-slot is small and cheap to print and a
   30-slot is realistic. Nobody makes a brand-fitted one.
3. **Liquid lipsticks, glosses and lip oils** (round doe-foot tubes,
   15-22 mm, 100-120 mm tall). Top-heavy, so depth matters most here.
4. **Concealers** (round doe-foot tubes, 16-23 mm). Very standardised, but
   people own one to three, so a concealer-only holder sells poorly. Better
   as part of a "daily face" mixed holder: concealer, mascara, liquid blush,
   lip. Measure them anyway; the mixed holder needs the numbers.
5. **Mascara** (round, 17-25 mm, tall). Two to five owned; fits the mixed
   holder above.
6. **Liquid blush and highlighter** (Rare Beauty Soft Pinch is a squat
   ~27 mm square-shouldered glass bottle). Rare Beauty alone is a search
   term: people collect four to eight shades.
7. **Nail polish** (OPI ~32 mm rectangular, Essie ~30-38 mm round, Olive &
   June square). Huge collections, and "OPI holder" is a brand search, but
   holes of 30-40 mm make a wide, long print. Worth its own product later.
8. **Skincare droppers and serums** (The Ordinary 30 ml is ~30 mm round;
   five to ten owned). Outside cosmetics but the same premise and a strong
   brand search. Later.

Not a fit: squeeze tubes (Rhode, Summer Fridays, most lip balms), compacts,
palettes, brushes (too variable), cushion foundations.

## Shopping list

Sephora carries the first group, Ulta the second; both stock Maybelline,
NYX and e.l.f. Estimates are outer diameter at the base in mm; "sq" means
square section.

### Lipstick

| Brand | Product | Where | Est. | Shape |
|---|---|---|---|---|
| Charlotte Tilbury | Matte Revolution / K.I.S.S.I.N.G | Sephora, Ulta | 20 | round |
| MAC | Matte / Macximal | Ulta | 20 | round |
| Rare Beauty | Kind Words Matte Lipstick | Sephora | 19 | round |
| NARS | Powermatte / Afterglow lipstick | Sephora, Ulta | 20 | round |
| Fenty Beauty | Fenty Icon (refillable) | Sephora, Ulta | 21 | round |
| Makeup by Mario | SuperSatin / UltraSuede | Sephora | 20 | round |
| Patrick Ta | Major Beauty Headlines | Sephora | 20 | round |
| Clinique | Almost Lipstick (Black Honey) | Sephora, Ulta | 17 | round |
| Maybelline | Color Sensational / SuperStay 24 | Ulta | 18 | round |
| Glossier | Generation G | Sephora | 19 | round |
| YSL | Rouge Pur Couture | Sephora, Ulta | 19 | sq |
| Dior | Rouge Dior | Sephora, Ulta | 20×22 | rect |
| Tom Ford | Lip Color | Sephora | 20×24 | rect |
| Chanel | Rouge Coco / Rouge Allure | Ulta | 19 | round |
| Hermès | Rouge Hermès | Sephora | 22 | round |

### Concealer

| Brand | Product | Where | Est. | Shape |
|---|---|---|---|---|
| Tarte | Shape Tape | Sephora, Ulta | 22 | round, wide cap |
| NARS | Radiant Creamy Concealer | Sephora, Ulta | 18 | round |
| Maybelline | Fit Me / Instant Age Rewind | Ulta | 16 / 20 | round |
| Rare Beauty | Liquid Touch Brightening Concealer | Sephora | 18 | round |
| Kosas | Revealer | Sephora | 18 | round |
| Too Faced | Born This Way Super Coverage | Sephora, Ulta | 18 | round |
| Huda Beauty | #FauxFilter Under Eye | Sephora | 20 | round |
| Charlotte Tilbury | Beautiful Skin Radiant Concealer | Sephora | 18 | round |
| e.l.f. | Camo / Hydrating Camo | Ulta | 18 | round |
| NYX | Bare With Me / Can't Stop Won't Stop | Ulta | 17 | round |
| YSL | All Hours Concealer | Sephora | 19 | round |
| Haus Labs | Triclone Skin Tech Concealer | Sephora | 18 | round |

### Liquid lip, gloss, oil (same trip, same shelves)

| Brand | Product | Where | Est. | Shape |
|---|---|---|---|---|
| Fenty Beauty | Gloss Bomb | Sephora, Ulta | 20 | round |
| Dior | Addict Lip Glow Oil | Sephora, Ulta | 24 | sq, rounded |
| Rare Beauty | Soft Pinch Tinted Lip Oil / Lip Soufflé | Sephora | 19 | round |
| Maybelline | SuperStay Matte Ink / Vinyl Ink | Ulta | 19 / 22 | round |
| NYX | Butter Gloss / Fat Oil | Ulta | 18 / 22 | round |
| Huda Beauty | Liquid Matte | Sephora | 18 | round |
| Charlotte Tilbury | Collagen Lip Bath | Sephora | 18 | round |
| Kosas | Wet Lip Oil Gloss | Sephora | 18 | round |

### Pencils (fast: one measurement per brand covers the line)

Charlotte Tilbury Lip Cheat, MAC Lip Pencil, NYX Slim Lip Pencil, Rare
Beauty Kind Words Lip Liner, Makeup by Mario Ultra Suede Lip Liner, Sephora
Collection Retractable, Urban Decay 24/7 Glide-On, Stila Stay All Day
(mechanical), Fenty Trace'd Out. Expect 7.5-8 mm wood and 9-11 mm plastic
mechanical bodies.

### Mascara and blush (for the mixed "daily face" holder)

Maybelline Lash Sensational / Sky High (~22 mm), Too Faced Better Than Sex
(~25 mm), Benefit They're Real (~23 mm), Lancôme Lash Idôle, L'Oréal
Telescopic (slim, ~15 mm), Rare Beauty Perfect Strokes, Glossier Lash Slick.
Rare Beauty Soft Pinch Liquid Blush (~27 mm sq shoulders), Rare Beauty
Positive Light Liquid Luminizer, Saie Dew Blush, Milk Cooling Water Jelly
Tint (fat stick, ~30 mm).

### Essential oils (Whole Foods, separate trip or same day)

Not cosmetics, but the same premise with a larger audience: doTERRA and
Young Living reps own thirty to sixty bottles, and the whole category ships
in standardised euro-dropper glass, so one measurement per size covers every
brand. Estimates, base outer diameter in mm:

| Size | Est. | Where |
|---|---|---|
| 5 ml dropper | 21-22 | Plant Therapy sets; doTERRA, Young Living (direct only) |
| 10 ml dropper | 23-25 | Plant Therapy |
| 15 ml dropper | 26-28 | Aura Cacia, Garden of Life; doTERRA, Young Living |
| 30 ml / 1 fl oz dropper | 32-34 | NOW Foods, Plant Therapy |
| 10 ml roll-on | 18-20 | Aura Cacia, Plant Therapy; overlaps the travel-spray sizes |

Caps are usually wider than the glass; record both. The product is a tiered
rack with mixed 5 and 15 ml holes and labels readable from the front;
competing wood racks give every bottle the same hole.

## The phone sheet (staging only, temporary)

`https://staging.holderforge.com/measure-run/?k=<measure_key>` is the same
list as `cosmetics-checklist.md` with Base, Height and Note fields per row,
example photos per category, and an Add line for products not on the list.
Every field saves on blur (and shortly after typing stops) to the backend's
`/measurements` API, which stores one DynamoDB item per row. The key is SSM
`/holderforge/staging/measure_key`; the page remembers it in localStorage
after the first visit, so later visits can drop `?k=`.

Read the results back with:

```
aws dynamodb scan --table-name holderforge-measurements-staging --output json
```

Remove before production, all together: `src/site/pages/MeasureRun.jsx` and
its route in `App.jsx`, `public/images/measure/`, the `Disallow` line in
`public/robots.txt`, `backend/src/handlers/measurements.js` with its test,
the `MeasurementsTable`/`MeasurementsFunction`/`IsStaging` block in
`backend/template.yaml` (and the PUT/DELETE CORS methods), the `measure_key`
SSM parameter, and this section. Production never gets the table or
function even if the template is deployed there, because both carry the
`IsStaging` condition.

## After the run

1. Add measured rows to `bottles.js` with `measured` and `height` filled in.
2. Set the makeup category's `types` and drop `comingSoon`.
3. Fix the makeup Etsy listing's tags to lipstick, lip liner, mascara and
   concealer terms, and add one Etsy listing per top brand measured
   (Charlotte Tilbury, MAC, Rare Beauty) mirroring the site's brand pages.
4. Decide the first pencil holder layout: 8-9 mm holes are small enough for
   more per row; check `minimumFootprint` before fixing 5 per row.
