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

// Hole sizes for a holder with a size per row, from a set of bottles: bottles
// are grouped from the largest down, a bottle joining the group while it is
// within MAX_GAP of the group's largest (fewest groups), and each group is
// sold at the smallest size that takes all of it. Ascending. Null when the
// bottles need more groups than `rows` or a group has no sold size.
export function sizesFor(product, bottleHoles, rows = 3) {
  const sorted = [...bottleHoles].sort((a, b) => b - a);
  const groups = [];
  for (const h of sorted) {
    const g = groups[groups.length - 1];
    if (g && g[0] - h <= MAX_GAP) g.push(h);
    else groups.push([h]);
  }
  if (!groups.length || groups.length > rows) return null;
  const sizes = groups.map((g) => bestSizeFor(product, g));
  return sizes.every(Boolean) ? sizes.reverse() : null;
}

// The size among `sizes` a bottle fits best (smallest gap), or null.
export function rowFor(sizes, bottleHole) {
  let best = null;
  for (const s of sizes) {
    const f = fitFor(s, bottleHole);
    if (f.ok && (best === null || f.gap < fitFor(best, bottleHole).gap)) best = s;
  }
  return best;
}

// Hole size of each row, front row first, for a holder sold with `sizes`
// (at most one per row). Rows run smallest first so the widest, usually
// tallest, bottles stand on the back, highest tier. Spare rows go to the size
// holding the most bottles, ties to the larger size.
export function rowsForSizes(sizes, bottleHoles, rows = 3) {
  const sorted = [...new Set(sizes)].sort((a, b) => a - b).slice(0, rows);
  if (!sorted.length) return null;
  const count = (s) => bottleHoles.filter((h) => rowFor(sorted, h) === s).length;
  const busiest = sorted.reduce((a, b) => (count(b) >= count(a) ? b : a));
  const plan = [];
  for (const s of sorted) {
    plan.push(s);
    if (s === busiest) while (plan.length + (sorted.length - sorted.indexOf(s) - 1) < rows) plan.push(s);
  }
  return plan;
}
