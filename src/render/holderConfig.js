// Designer configuration for a holder, without importing three.js, so
// catalog pages can describe a render before the scene module loads.
import { minimumFootprint } from "../model/ModelCalculator.js";

// Builds the full designer configuration. `hole` sets every row; `holes`
// (front row first) sets a size per row and takes precedence. `width`/`depth`
// default to the minimum footprint of the widest row.
export function holderConfig({ hole, holes, holesPerRow = 5, rows = 3, bottleHeight = 120, shape = "circle", width, depth }) {
  const rowHoles = Array.from({ length: rows }, (_, i) => holes?.[i] ?? hole);
  const footprint = minimumFootprint(Math.max(...rowHoles), holesPerRow);
  const config = {
    mm2pixel: 2,
    rows,
    number_holes_per_row: holesPerRow,
    edge_gap_scale_factor: 1.32,
    model_chamfer: 5,
    model_width: width ?? footprint.model_width,
    model_depth: depth ?? footprint.model_depth,
  };
  for (let r = 1; r <= rows; r++) {
    config[`row_${r}_hole_diameter`] = rowHoles[r - 1];
    config[`row_${r}_bottle_height`] = bottleHeight;
    config[`row_${r}_hole_shape`] = shape;
  }
  return config;
}
