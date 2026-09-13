"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeMeasurement } = require("../src/handlers/measurements");

test("keeps known fields, rounds numbers, drops the rest", () => {
  const item = sanitizeMeasurement("lipstick-round--mac--matte", {
    base: 19.96,
    height: 78,
    note: "cap flush",
    brand: "MAC",
    custom: false,
    extra: "ignored",
  });
  assert.deepEqual(item, { id: "lipstick-round--mac--matte", base: 20, height: 78, note: "cap flush", brand: "MAC", custom: false });
});

test("empty strings clear a field", () => {
  const item = sanitizeMeasurement("row-1", { base: "", height: 12, note: "" });
  assert.deepEqual(item, { id: "row-1", height: 12, custom: false });
});

test("rejects bad ids and types", () => {
  assert.throws(() => sanitizeMeasurement("Bad Id", {}), /invalid id/);
  assert.throws(() => sanitizeMeasurement("row-1", { base: "20" }), /base must be a number/);
  assert.throws(() => sanitizeMeasurement("row-1", { base: 5000 }), /base must be a number/);
  assert.throws(() => sanitizeMeasurement("row-1", { note: 5 }), /note must be a string/);
  assert.throws(() => sanitizeMeasurement("row-1", []), /object/);
});
