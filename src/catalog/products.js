// Catalog holders. A product is a named preset of the designer configuration:
// `layout` fixes rows and holes per row, `holeSizes` lists the hole diameters
// it is sold in (one size per holder), `fitsHoles` optionally widens the
// bottle sizes it accepts (the universal holder), and `configFor(hole)` yields
// the same eleven fields the designer sends to checkout.
//
// priceCents is display-only until the order API prices by SKU.
// images: { [colorId]: [url, ...] }. Missing entries render a placeholder.

const MIN_INNER_GAP = 2.75;
const EDGE_GAP_SCALE = 1.32;

// Mirrors computeRequiredModelDimensions in src/GridPreview.jsx: the smallest
// footprint that fits `holesPerRow` holes of `hole` mm per row.
export function footprintFor(hole, holesPerRow = 5) {
  const padding = MIN_INNER_GAP * EDGE_GAP_SCALE;
  return {
    model_width: Math.ceil(MIN_INNER_GAP * (holesPerRow - 1) + 2 * padding + holesPerRow * hole),
    model_depth: Math.ceil(3 * (8 + hole)),
  };
}

function configFor(hole, bottleHeight = 100) {
  return {
    ...footprintFor(hole),
    row_1_hole_diameter: hole,
    row_2_hole_diameter: hole,
    row_3_hole_diameter: hole,
    row_1_bottle_height: bottleHeight,
    row_2_bottle_height: bottleHeight,
    row_3_bottle_height: bottleHeight,
    row_1_hole_shape: "circle",
    row_2_hole_shape: "circle",
    row_3_hole_shape: "circle",
  };
}

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const products = [
  {
    slug: "travel-spray-holder-15-slot",
    name: "15-Slot Travel Spray Holder",
    tagline: "Three staggered tiers, made with the hole size for your bottles.",
    categories: ["travel-sprays", "decants", "rollerballs"],
    layout: { rows: 3, holesPerRow: 5 },
    holeSizes: range(15, 22),
    priceCents: 4500,
    description:
      "Holds 15 travel sprays, rollerballs or decants in three staggered tiers so every label is visible. Each holder is printed with one hole size, chosen to match your bottles: pick the brand and the size is set for you, or measure the base and add 1 mm.",
    images: {},
    configFor,
  },
  {
    slug: "sample-vial-holder-15-slot",
    name: "15-Slot Sample Vial Holder",
    tagline: "12 mm holes for 1-2ml sample sprays and vials.",
    categories: ["decants"],
    layout: { rows: 3, holesPerRow: 5 },
    holeSizes: [12],
    priceCents: 4000,
    description:
      "For the little 1-2ml sample sprays that come with orders and in discovery sets. One universal 12 mm hole size fits the common vial bodies; no measuring needed.",
    images: {},
    configFor: (hole) => configFor(hole, 60),
  },
  {
    slug: "universal-travel-spray-holder-15-slot",
    name: "Universal Travel Spray Holder",
    tagline: "One 23 mm hole size for a mixed collection of 15-22 mm bottles.",
    categories: ["travel-sprays", "rollerballs", "decants"],
    layout: { rows: 3, holesPerRow: 5 },
    holeSizes: [23],
    // Bottle hole sizes this oversized hole accepts (see productsForHole).
    fitsHoles: [15, 22],
    priceCents: 4500,
    description:
      "Own bottles from several brands? The universal holder uses one oversized 23 mm hole so anything from 15 to 22 mm stands in it. Looser fit than a matched size, but nothing to measure.",
    images: {},
    configFor,
  },
  {
    slug: "makeup-organizer-15-slot",
    name: "15-Slot Lipstick & Makeup Organizer",
    tagline: "Lipstick, mascara and concealer tubes, sized to the brand.",
    categories: ["makeup"],
    layout: { rows: 3, holesPerRow: 5 },
    holeSizes: range(15, 25),
    priceCents: 4500,
    description:
      "The same three-tier layout sized for makeup tubes. Round tubes pick a hole size below; square or rectangular tubes are made to order in the designer with square holes.",
    images: {},
    configFor: (hole) => configFor(hole, 90),
  },
];

export const productBySlug = (slug) => products.find((p) => p.slug === slug);
