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
- `index.js`: queries (`search`, `fitsForProduct`, `productsForHole`,
  `brands`, `staticRoutes`) shared by pages and the prerender script.

## Photos

`products[].images` maps a colour id to an array of image URLs; the first is
the gallery hero for that colour. Until an entry exists the page shows a
tinted placeholder. Convention: `public/images/products/<product-slug>/<color-id>-<n>.jpg`,
e.g. `public/images/products/travel-spray-holder-15-slot/copper-1.jpg`, then

```js
images: { copper: ["/images/products/travel-spray-holder-15-slot/copper-1.jpg"] }
```

Keep photos under ~300 KB (1600 px wide is plenty). Brand pages and the
measuring guide also show placeholders; those get real photos in a later pass.

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
