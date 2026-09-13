// Designer configuration for a uniform holder, without importing three.js,
// so catalog pages can describe a render before the scene module loads.
import { minimumFootprint } from "../model/ModelCalculator.js";

// Builds the full designer configuration for a uniform holder (same hole on
// every row). `width`/`depth` default to the minimum footprint.
export function holderConfig({ hole, holesPerRow = 5, rows = 3, bottleHeight = 120, shape = "circle", width, depth }) {
  const footprint = minimumFootprint(hole, holesPerRow);
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
    config[`row_${r}_hole_diameter`] = hole;
    config[`row_${r}_bottle_height`] = bottleHeight;
    config[`row_${r}_hole_shape`] = shape;
  }
  return config;
}
