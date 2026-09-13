# Catalog storefront

The site has two halves that share one header, one theme and (eventually) one
checkout: the **designer** at `/design` (`src/GridPreview.jsx`, unchanged
except for the header links and the `?d=<mm>` prefill) and the **catalog**
under `src/site/`, driven entirely by the data files in `src/catalog/`.

## Routes

| Route | Page | Source |
|---|---|---|
| `/` | Home: what a holder is, find-your-bottle search, categories, holders | `site/pages/Home.jsx` |
| `/shop` | Catalog grid with category and bottle-size filters | `site/pages/Shop.jsx` |
| `/shop/<category>` | Same grid fixed to one category, own title and copy | `site/pages/Shop.jsx` |
| `/shop/<product>` | Product page: gallery, bottle picker, size, colour, specs, fits list | `site/pages/Product.jsx` |
| `/find?q=` | Bottle finder results table | `site/pages/Find.jsx` |
| `/fits` | Every measured bottle, by size and by brand | `site/pages/FitsIndex.jsx` |
| `/fits/<brand>` | Brand landing page (the long-tail SEO page) | `site/pages/Fits.jsx` |
| `/fits/<n>mm` | Size landing page | `site/pages/Fits.jsx` |
| `/guides/how-to-measure` | Measuring guide | `site/pages/Measure.jsx` |
| `/design` | The configurator | `GridPreview.jsx` |

Product page state lives in the query string (`?size=19&color=copper&bottle=<id>`)
so links from finder and brand pages can preselect it. The canonical URL is the
clean path.

## Data files (`src/catalog/`)

- `bottles.js`: one row per bottle a brand sells. `hole` is the hole diameter
  that fits it (measured base + 1 mm). Adding a row creates the brand page,
  adds the bottle to the matching size page, the finder, and every product's
  "fits" list. Set `measured`/`height` when known; `aliases` feed search.
- `products.js`: catalog holders. A product is a preset of the designer
  config: `layout`, `holeSizes` (sold sizes, one per holder), optional
  `fitsHoles` (a range of bottle sizes an oversized hole accepts), price,
  copy, and `images`. `configFor(hole)` returns the eleven designer fields.
- `categories.js`: "what are you holding" groups; each lists the bottle
  `types` it covers. Products declare `categories`; fits lists and
  suggestions only cross-reference bottles of those types.
- `colors.js`: filament colours. `available: false` shows a crossed-out
  swatch rather than hiding it.
- `fit.js`: the fit rule, stated once. A holder with hole S takes bottles whose
  recommended hole is S (snug), S-1 (a little room) or S-2 (loose, may lean).
  `fitFor`, `fitForAll`, `bestSizeFor` and `RULE_TEXT` drive the size pills,
  the mixed-collection check, size pages and "holders that fit" lists.
- `index.js`: queries (`search`, `fitsForProduct`, `bottlesFittingSize`,
  `productsForHole`, `brands`, `staticRoutes`) shared by pages and the
  prerender script.

## Photos

`products[].images` maps a colour id to an array of image URLs; the first is
the gallery hero for that colour. The 15-slot holders are one print with
different hole sizes, so they share the colour shots in
`public/images/products/15-slot/<color-id>.jpg` and differ only in the
bottles-in-holder heroes (`<color-id>-<what>.jpg`), composed per product with
`withHeroes()` in `products.js`. These files are the Etsy listing photos
(`docs/etsy/listings.json` has the originals). A product-specific photo goes
in `public/images/products/<product-slug>/`.

Gallery order on the product page: photos of the chosen colour (or, when that
colour has none, of the first colour that has photos, badged "Photographed
in …"), then the render in the chosen colour, then the live 3D view. The
render is always offered so a colour without photos still shows its finish.
Keep photos under ~300 KB (1400 px on the long side). Brand pages and the
measuring guide still show placeholders. Colours seen in the Etsy photos but
not in `colors.js` (matte dusty rose, matte lime) were left out.

## Holder pictures

Rendered, never drawn by hand: see `docs/renders.md`. The home hero is a live
`HolderCanvas`; product cards and galleries use `public/images/renders/` PNGs
until a real photo is listed in `products[].images`.

## Build and SEO

`npm run build` runs `vite build` then `scripts/prerender.mjs`, which builds a
server bundle of `src/entry-server.jsx`, renders every route from
`staticRoutes()` into `dist/<route>/index.html` (title, description,
canonical, Open Graph, JSON-LD and styled-components CSS inlined), and writes
`dist/sitemap.xml`. `/design` gets the empty shell with its own head tags
because it needs WebGL. `main.jsx` hydrates when the served markup matches the
URL (root `data-route`) and client-renders otherwise, which is what happens
when the SPA rewrite serves `index.html` for an unknown path.

## Not done yet

- Checkout from catalog pages. The order API accepts only the eleven holder
  fields; it needs `color` and a product SKU (with server-side pricing per SKU)
  before the catalog "Buy now" can be enabled. Until then the button is
  disabled and the page links to the designer prefilled with the same size.
- The "3D with your bottles" gallery slot is a placeholder.
- Real photography (see above), reviews import, analytics.
