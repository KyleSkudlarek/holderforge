"use strict";

// The holder configuration a customer can order. Mirrors the user-editable
// fields of baseModelConfigAtom in src/GridPreview.jsx; the derived geometry
// (tier heights, paddings) is recomputed by the configurator from these inputs,
// so they are the complete specification of a print.
//
// Units are millimetres. Ranges are deliberately generous sanity bounds, not
// printability guarantees.

const RANGES = {
  model_width: [60, 300],
  model_depth: [40, 200],
  row_1_hole_diameter: [8, 40],
  row_2_hole_diameter: [8, 40],
  row_3_hole_diameter: [8, 40],
  row_1_bottle_height: [30, 250],
  row_2_bottle_height: [30, 250],
  row_3_bottle_height: [30, 250],
};
const SHAPES = new Set(["circle", "square"]);
const SHAPE_FIELDS = ["row_1_hole_shape", "row_2_hole_shape", "row_3_hole_shape"];

// Compact keys keep the JSON under Stripe's 500-character metadata value limit.
const COMPACT = {
  model_width: "w",
  model_depth: "d",
  row_1_hole_diameter: "d1",
  row_2_hole_diameter: "d2",
  row_3_hole_diameter: "d3",
  row_1_bottle_height: "h1",
  row_2_bottle_height: "h2",
  row_3_bottle_height: "h3",
  row_1_hole_shape: "s1",
  row_2_hole_shape: "s2",
  row_3_hole_shape: "s3",
};
const EXPAND = Object.fromEntries(Object.entries(COMPACT).map(([k, v]) => [v, k]));

// Validates and normalises a raw config object. Returns the cleaned config or
// throws an Error whose message is safe to return to the browser.
function parseHolderConfig(input) {
  if (!input || typeof input !== "object") throw new Error("config is required");
  const out = {};
  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const n = Number(input[field]);
    if (!Number.isFinite(n)) throw new Error(`${field} must be a number`);
    if (n < min || n > max) throw new Error(`${field} must be between ${min} and ${max} mm`);
    out[field] = Math.round(n * 10) / 10;
  }
  for (const field of SHAPE_FIELDS) {
    const s = String(input[field] || "").toLowerCase();
    if (!SHAPES.has(s)) throw new Error(`${field} must be circle or square`);
    out[field] = s;
  }
  return out;
}

function compactConfig(cfg) {
  return Object.fromEntries(Object.entries(cfg).map(([k, v]) => [COMPACT[k], v]));
}

function expandConfig(compact) {
  return Object.fromEntries(Object.entries(compact).map(([k, v]) => [EXPAND[k] || k, v]));
}

// One-line human summary used for the Stripe line item and the order email.
function describeHolder(cfg) {
  const row = (i) =>
    `R${i}: ${cfg[`row_${i}_hole_diameter`]}mm ${cfg[`row_${i}_hole_shape`]}, ${cfg[`row_${i}_bottle_height`]}mm bottle`;
  return `${cfg.model_width} x ${cfg.model_depth} mm | ${row(1)} | ${row(2)} | ${row(3)}`;
}

// Multi-line spec block for the owner's print sheet.
function specSheet(cfg) {
  const lines = [
    `Model width:        ${cfg.model_width} mm`,
    `Model depth:        ${cfg.model_depth} mm`,
  ];
  for (const i of [1, 2, 3]) {
    lines.push(
      `Row ${i}: hole ${cfg[`row_${i}_hole_diameter`]} mm ${cfg[`row_${i}_hole_shape`]}, bottle height ${cfg[`row_${i}_bottle_height`]} mm`
    );
  }
  return lines.join("\n");
}

module.exports = { parseHolderConfig, compactConfig, expandConfig, describeHolder, specSheet };
