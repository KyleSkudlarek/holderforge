// Derived holder dimensions from the user-editable configuration: tier
// heights, hole depths, spacing and paddings. Shared by the designer
// (src/GridPreview.jsx) and the renderer (src/render/holderScene.js) so both
// agree on every millimetre.
//
// Units are millimetres. `config` carries the fields of baseModelConfigAtom in
// GridPreview.jsx: rows, number_holes_per_row, edge_gap_scale_factor,
// model_chamfer, model_width, model_depth, row_N_hole_diameter,
// row_N_bottle_height and row_N_hole_shape.

export const MIN_INNER_GAP = 2.75;

// Smallest footprint that fits `holesPerRow` holes of `hole` mm per row.
// Mirrors computeRequiredModelDimensions in GridPreview.jsx.
export function minimumFootprint(hole, holesPerRow = 5, edgeGapScale = 1.32) {
  const padding = MIN_INNER_GAP * edgeGapScale;
  return {
    model_width: Math.ceil(MIN_INNER_GAP * (holesPerRow - 1) + 2 * padding + holesPerRow * hole),
    model_depth: Math.ceil(3 * (8 + hole)),
  };
}

export default class ModelCalculator {

  // Computes the hole height based on hole diameter and bottle height.  
  getHoleHeight(override, holeDiameter, bottleHeight) {
    if (override !== null && override !== undefined) return override;

    if (bottleHeight > 80 && bottleHeight <= 130) return 21;
    if (bottleHeight < 60) return 14;

    return holeDiameter * 1.1;
  }

    
    // Computes the first tier extrusion distance based on hole height.
    getTier1ExtrusionDistance(override, holeHeight) {
      if (override !== null && override !== undefined) return override;
  
      if (holeHeight >= 16) return 24;
      if (holeHeight < 16) return 19;
  
      return holeHeight + 5;
    }

    // Computes the top two tiers' height based on the first tier height.
    getTier23ExtrusionDistance(override, firstTierHeight) {
      if (override !== null && override !== undefined) return override;

      if (firstTierHeight >= 21) return firstTierHeight - 5;
      if (firstTierHeight < 21) return firstTierHeight - 1;

      return firstTierHeight - 3;
    }

  constructor(config) {
    this.config = config;

    this.row_1_depth = this.config.model_depth / this.config.rows;
    this.row_2_depth = this.config.model_depth / this.config.rows;
    this.row_3_depth = this.config.model_depth / this.config.rows;

    this.row_1_min_width = this.config.row_1_hole_diameter * this.config.number_holes_per_row;  
    this.row_2_min_width = this.config.row_2_hole_diameter * this.config.number_holes_per_row;  
    this.row_3_min_width = this.config.row_3_hole_diameter * this.config.number_holes_per_row;  


    this.row_1_free_space = this.config.model_width - this.row_1_min_width;
    this.row_2_free_space = this.config.model_width - this.row_2_min_width;
    this.row_3_free_space = this.config.model_width - this.row_3_min_width;

    this.row_1_average_gap = this.row_1_free_space / (this.config.number_holes_per_row + 1);
    this.row_2_average_gap = this.row_2_free_space / (this.config.number_holes_per_row + 1);
    this.row_3_average_gap = this.row_3_free_space / (this.config.number_holes_per_row + 1);

    this.row_1_padding_left_right = this.row_1_average_gap * this.config.edge_gap_scale_factor;
    this.row_2_padding_left_right = this.row_2_average_gap * this.config.edge_gap_scale_factor;
    this.row_3_padding_left_right = this.row_3_average_gap * this.config.edge_gap_scale_factor;

    this.row_1_padding_top_bottom = (this.row_1_depth - this.config.row_1_hole_diameter) / 2;
    this.row_2_padding_top_bottom = (this.row_2_depth - this.config.row_2_hole_diameter) / 2;
    this.row_3_padding_top_bottom = (this.row_3_depth - this.config.row_3_hole_diameter) / 2;


    this.row_1_inner_gap = (this.config.model_width - (this.row_1_padding_left_right * 2) - this.row_1_min_width) / (this.config.number_holes_per_row - 1);
    this.row_2_inner_gap = (this.config.model_width - (this.row_2_padding_left_right * 2) - this.row_2_min_width) / (this.config.number_holes_per_row - 1);
    this.row_3_inner_gap = (this.config.model_width - (this.row_3_padding_left_right * 2) - this.row_3_min_width) / (this.config.number_holes_per_row - 1);
  
    this.row_1_hole_height = this.getHoleHeight(null, this.config.row_1_hole_diameter, this.config.row_1_bottle_height);
    this.tier_1_depth = this.row_1_depth;
    this.tier_1_total_depth = this.config.model_depth;
    this.tier_1_extrusion_distance = this.getTier1ExtrusionDistance(null, this.row_1_hole_height);
    this.row_1_hole_horizontal_constraint = this.row_1_padding_left_right + (this.config.row_1_hole_diameter / 2);
    this.row_1_hole_vertical_constraint = this.row_1_padding_top_bottom + (this.config.row_1_hole_diameter / 2);
    this.row_1_rectangular_repeat_pattern_distance = (4 * this.config.row_1_hole_diameter) + ( 4 * this.row_1_inner_gap);


      
    this.row_2_hole_height = this.getHoleHeight(null, this.config.row_2_hole_diameter, this.config.row_2_bottle_height);
    this.tier_2_depth = this.row_2_depth;
    this.tier_2_total_depth = this.row_2_depth + this.row_3_depth ;
    this.tier_2_extrusion_distance = this.getTier23ExtrusionDistance(null, this.tier_1_extrusion_distance);
    this.row_2_hole_horizontal_constraint = this.row_2_padding_left_right + (this.config.row_2_hole_diameter / 2);
    this.row_2_hole_vertical_constraint = this.row_2_padding_top_bottom + (this.config.row_2_hole_diameter / 2);
    this.row_2_rectangular_repeat_pattern_distance = (4 * this.config.row_2_hole_diameter) + ( 4 * this.row_2_inner_gap);


    this.row_3_hole_height = this.getHoleHeight(null, this.config.row_3_hole_diameter, this.config.row_3_bottle_height);
    this.tier_3_depth = this.row_3_depth ;
    this.tier_3_total_depth = this.row_3_depth ;
    this.tier_3_extrusion_distance = this.getTier23ExtrusionDistance(null, this.tier_1_extrusion_distance);
    this.row_3_hole_horizontal_constraint = this.row_3_padding_left_right + (this.config.row_3_hole_diameter / 2);
    this.row_3_hole_vertical_constraint = this.row_3_padding_top_bottom + (this.config.row_3_hole_diameter / 2);
    this.row_3_rectangular_repeat_pattern_distance = (4 * this.config.row_3_hole_diameter) + ( 4 * this.row_3_inner_gap);

    this.model_height = this.tier_1_extrusion_distance + this.tier_2_extrusion_distance + this.tier_3_extrusion_distance;
  }
  
  getCalculatedModelDimensions() {

    // Return an object containing the calculated values
    return {
      row_1_depth: this.row_1_depth,
      row_2_depth: this.row_2_depth,
      row_3_depth: this.row_3_depth,
      row_1_padding_left_right: this.row_1_padding_left_right,
      row_2_padding_left_right: this.row_2_padding_left_right,
      row_3_padding_left_right: this.row_3_padding_left_right,
      row_1_padding_top_bottom: this.row_1_padding_top_bottom,
      row_2_padding_top_bottom: this.row_2_padding_top_bottom,
      row_3_padding_top_bottom: this.row_3_padding_top_bottom,
      row_1_inner_gap: this.row_1_inner_gap,
      row_2_inner_gap: this.row_2_inner_gap,
      row_3_inner_gap: this.row_3_inner_gap,
      tier_1_extrusion_distance: this.tier_1_extrusion_distance,
      tier_1_depth: this.tier_1_depth,
      tier_1_total_depth: this.tier_1_total_depth,
      row_1_hole_height: this.row_1_hole_height,
      row_1_hole_horizontal_constraint: this.row_1_hole_horizontal_constraint,
      row_1_hole_vertical_constraint: this.row_1_hole_vertical_constraint,
      row_1_rectangular_repeat_pattern_distance: this.row_1_rectangular_repeat_pattern_distance,
      tier_2_depth: this.tier_2_depth,
      tier_2_total_depth: this.tier_2_total_depth,
      tier_2_extrusion_distance: this.tier_2_extrusion_distance,
      row_2_hole_height: this.row_2_hole_height,
      row_2_hole_horizontal_constraint: this.row_2_hole_horizontal_constraint,
      row_2_hole_vertical_constraint: this.row_2_hole_vertical_constraint,
      row_2_rectangular_repeat_pattern_distance: this.row_2_rectangular_repeat_pattern_distance,
      tier_3_depth: this.tier_3_depth,
      tier_3_total_depth: this.tier_3_total_depth,
      tier_3_extrusion_distance: this.tier_3_extrusion_distance,
      row_3_hole_height: this.row_3_hole_height,
      row_3_hole_horizontal_constraint: this.row_3_hole_horizontal_constraint,
      row_3_hole_vertical_constraint: this.row_3_hole_vertical_constraint,
      row_3_rectangular_repeat_pattern_distance: this.row_3_rectangular_repeat_pattern_distance,
      model_height: this.model_height,
    };
  }
}
