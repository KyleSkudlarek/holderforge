// The fit rule, stated once. A bottle's `hole` (bottles.js) is its measured
// base plus 1 mm. A holder sold with hole size S accepts bottles whose hole is
// S (snug), S - 1 (fits with a little room) or S - 2 (loose, may lean). A
// bottle needing a larger hole will not go in; one more than 2 mm smaller
// falls over. Every page that talks about fit reads from here.

export const FIT_GRADES = [
  { gap: 0, id: "snug", label: "Snug fit", short: "snug", tone: "success" },
  { gap: 1, id: "fine", label: "Fits, a little room", short: "a little room", tone: "success" },
  { gap: 2, id: "loose", label: "Loose, may lean", short: "loose", tone: "warning" },
];

export const MAX_GAP = FIT_GRADES[FIT_GRADES.length - 1].gap;

export const RULE_TEXT = "A hole fits bottles 1 to 3 mm narrower than it: 1 mm narrower is snug, 3 mm narrower is loose and may lean.";

// Fit of one bottle (by its recommended hole) in a holder with hole `holeSize`.
export function fitFor(holeSize, bottleHole) {
  const gap = holeSize - bottleHole;
  if (gap < 0) return { id: "small", label: "Won't fit", short: "won't fit", tone: "error", gap, ok: false };
  const grade = FIT_GRADES.find((g) => g.gap === gap);
  if (!grade) return { id: "too-loose", label: "Too loose", short: "too loose", tone: "error", gap, ok: false };
  return { ...grade, ok: true };
}

// Worst fit among several bottles at one hole size; null for no bottles.
export function fitForAll(holeSize, bottleHoles) {
  let worst = null;
  for (const h of bottleHoles) {
    const f = fitFor(holeSize, h);
    if (!worst || (!f.ok && worst.ok) || (f.ok === worst.ok && f.gap > worst.gap)) worst = f;
  }
  return worst;
}

// Hole size to recommend for a set of bottles: the largest bottle's hole, so
// every bottle goes in and the biggest is snug. Smaller bottles may be loose;
// callers check with fitFor.
export const recommendedHole = (bottleHoles) => (bottleHoles.length ? Math.max(...bottleHoles) : null);

// Smallest size a product is sold in that accepts every bottle, or null.
export function bestSizeFor(product, bottleHoles) {
  if (!bottleHoles.length) return null;
  const need = recommendedHole(bottleHoles);
  const sizes = [...product.holeSizes].sort((a, b) => a - b);
  return sizes.find((s) => s >= need && fitForAll(s, bottleHoles).ok) ?? null;
}

// Plan for a holder with a different hole size per row. Bottles are grouped
// from the largest down; a bottle joins the current group while it is within
// MAX_GAP of the group's largest, which yields the fewest groups. Each group
// is sold at the smallest size that takes all of it (bestSizeFor). Rows are
// ordered smallest hole first, so the widest (usually tallest) bottles stand
// on the back, highest tier. With fewer groups than rows, the group holding
// the most bottles takes the spare rows. Null when the bottles need more
// groups than the holder has rows, or a group has no sold size.
// Returns one entry per row: { hole, bottleHoles } (entries may repeat).
export function rowPlanFor(product, bottleHoles, rows = 3) {
  if (!bottleHoles.length) return null;
  const sorted = [...bottleHoles].sort((a, b) => b - a);
  const groups = [];
  for (const h of sorted) {
    const g = groups[groups.length - 1];
    if (g && g.bottleHoles[0] - h <= MAX_GAP) g.bottleHoles.push(h);
    else groups.push({ bottleHoles: [h] });
  }
  if (groups.length > rows) return null;
  for (const g of groups) {
    g.hole = bestSizeFor(product, g.bottleHoles);
    if (!g.hole) return null;
  }
  groups.reverse();
  const busiest = groups.reduce((a, b) => (b.bottleHoles.length > a.bottleHoles.length ? b : a));
  const plan = [];
  for (const g of groups) {
    plan.push(g);
    if (g === busiest) while (plan.length + (groups.length - groups.indexOf(g) - 1) < rows) plan.push(g);
  }
  return plan;
}
