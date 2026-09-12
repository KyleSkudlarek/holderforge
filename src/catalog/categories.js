// "What are you holding?" groupings shown on the home and shop pages. Each
// category lists the bottle types it covers; products declare the categories
// they belong to.
export const categories = [
  {
    slug: "travel-sprays",
    name: "Travel sprays",
    short: "10ml atomizers from Sephora, Ulta and brand travel sets",
    types: ["travel-spray"],
    description:
      "Most 10ml travel sprays measure between 14 and 21 mm across the base. Pick the brand and the holder is made with the matching hole size.",
  },
  {
    slug: "decants",
    name: "Decants & samples",
    short: "ScentSplit, DecantX and 1-5ml sample vials",
    types: ["decant", "sample"],
    description:
      "Decant services use a handful of standard atomizers. ScentSplit's 9ml is 19 mm, DecantX's 10ml is 15 mm, and 1-2ml sample sprays fit a 12 mm hole.",
  },
  {
    slug: "rollerballs",
    name: "Rollerballs",
    short: "Oil and perfume rollerballs, 6-10ml",
    types: ["rollerball"],
    description: "Rollerballs are narrower than sprays and tall, so a snug hole matters more. Sizes run 16 to 19 mm.",
  },
  {
    slug: "makeup",
    name: "Lipstick & makeup",
    short: "Lipstick, mascara and concealer tubes, round or square",
    types: [],
    description:
      "Round and square tubes both work. Brand measurements are being added; until then, measure the tube and pick the size, or design a holder with square holes.",
    comingSoon: true,
  },
];

export const categoryBySlug = (slug) => categories.find((c) => c.slug === slug);
