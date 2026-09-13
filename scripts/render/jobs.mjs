// Static render jobs for scripts/render/render-images.mjs. Each job names an
// output file under public/images/renders/ and the scene to draw. Add a job
// here whenever a page needs a fixed picture of a holder; live canvases use
// src/site/HolderCanvas.jsx instead and need nothing here.
//
// Fields: out, hole, colour (hex), view (VIEWS key in src/render/holderScene.js),
// width/height (CSS px; captured at `scale`), bottles ({diameter, height} or false),
// holesPerRow, rows, bottleHeight, shape.
import { products } from "../../src/catalog/products.js";
import { colors } from "../../src/catalog/colors.js";

export const jobs = [
  // Home page hero, 2x, transparent.
  { out: "hero.png", hole: 19, colour: "#d9a08a", view: "hero", width: 1040, height: 780, scale: 2 },

  // One picture per product and colour, at the product's first hole size.
  ...products.flatMap((p) =>
    colors.map((c) => ({
      out: `${p.slug}/${c.id}.png`,
      hole: p.holeSizes[0],
      holesPerRow: p.layout.holesPerRow,
      rows: p.layout.rows,
      colour: c.swatch,
      view: "card",
      width: 800,
      height: 600,
      scale: 1,
    }))
  ),
];
