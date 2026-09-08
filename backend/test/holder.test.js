"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseHolderConfig, compactConfig, expandConfig, describeHolder } = require("../src/lib/holder");

const valid = {
  model_width: 120,
  model_depth: 81,
  row_1_hole_diameter: 15,
  row_2_hole_diameter: 15,
  row_3_hole_diameter: 15,
  row_1_bottle_height: 120,
  row_2_bottle_height: 120,
  row_3_bottle_height: 120,
  row_1_hole_shape: "circle",
  row_2_hole_shape: "circle",
  row_3_hole_shape: "square",
};

test("accepts the configurator defaults and drops unknown fields", () => {
  const parsed = parseHolderConfig({ ...valid, mm2pixel: 2, rows: 3 });
  assert.deepEqual(parsed, valid);
});

test("rejects out-of-range and malformed values", () => {
  assert.throws(() => parseHolderConfig({ ...valid, model_width: 5 }), /model_width/);
  assert.throws(() => parseHolderConfig({ ...valid, row_2_hole_diameter: "abc" }), /row_2_hole_diameter/);
  assert.throws(() => parseHolderConfig({ ...valid, row_1_hole_shape: "hex" }), /circle or square/);
  assert.throws(() => parseHolderConfig(null), /required/);
});

test("compact form round-trips and fits Stripe metadata limits", () => {
  const compact = compactConfig(valid);
  assert.ok(JSON.stringify(compact).length < 500);
  assert.deepEqual(expandConfig(compact), valid);
});

test("description mentions every row", () => {
  const d = describeHolder(valid);
  assert.match(d, /120 x 81 mm/);
  assert.match(d, /R1:.*R2:.*R3:/);
});
