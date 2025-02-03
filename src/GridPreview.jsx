import React from "react";
import styled from "styled-components";
import { atom, useAtom } from "jotai";

const baseModelConfigAtom = atom({
  
  // System values (not editable by user)
  mm2pixel: 2,
  rows: 3,
  number_holes_per_row: 5,
  edge_gap_scale_factor: 1.32,

  // Default values for user inputs
  model_width: 120,
  model_depth: 81,
  row_1_hole_diameter: 15,
  row_2_hole_diameter: 15,
  row_3_hole_diameter: 15,
  row_1_bottle_height: 100,
  row_2_bottle_height: 100,
  row_3_bottle_height: 100,
});

// Jotai state for grid (explicit row hole sizes)
const modelConfigAtom = atom((get) => {
  // The 'get' function allows us to access other atoms
  const config = get(baseModelConfigAtom);
  
  // Create a new instance of the ModelCalculator class with current state of the BaseModelConfigAtom (config)
  const modelCalculator = new ModelCalculator(config);

  // Return a new object with the original config and the calculated values
  return {
    ...config, // Keep user inputs
    ...modelCalculator.getCalculatedModelDimensions(), // Add calculated values
  };
});


class ModelCalculator {
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

    this.row_1_padding_left_right = Math.ceil((this.row_1_average_gap * this.config.edge_gap_scale_factor * 10)) / 10;
    this.row_2_padding_left_right = Math.ceil((this.row_2_average_gap * this.config.edge_gap_scale_factor * 10)) / 10;
    this.row_3_padding_left_right = Math.ceil((this.row_3_average_gap * this.config.edge_gap_scale_factor * 10)) / 10;

    this.row_1_padding_top_bottom = (this.row_1_depth - this.config.row_1_hole_diameter) / 2;
    this.row_2_padding_top_bottom = (this.row_2_depth - this.config.row_2_hole_diameter) / 2;
    this.row_3_padding_top_bottom = (this.row_3_depth - this.config.row_3_hole_diameter) / 2;


    this.row_1_inner_gap = (this.config.model_width - (this.row_1_padding_left_right * 2) - this.row_1_min_width) / (this.config.number_holes_per_row - 1);
    this.row_2_inner_gap = (this.config.model_width - (this.row_2_padding_left_right * 2) - this.row_2_min_width) / (this.config.number_holes_per_row - 1);
    this.row_3_inner_gap = (this.config.model_width - (this.row_3_padding_left_right * 2) - this.row_3_min_width) / (this.config.number_holes_per_row - 1);
  
    this.row_1_hole_height = this.getHoleHeight(null, this.config.row_1_hole_diameter, this.config.row_1_bottle_height);
    this.tier_1_extrusion_distance = this.getFirstTierExtrusionDistance(null, this.row_1_hole_height);
    this.row_1_hole_horizontal_constraint = this.row_1_padding_left_right + (this.config.row_1_hole_diameter / 2);
    this.row_1_hole_vertical_constraint = this.row_1_padding_top_bottom + (this.config.row_1_hole_diameter / 2);
    this.row_1_rectangular_repeat_pattern_distance = (4 * this.config.row_1_hole_diameter) + ( 4 * this.row_1_inner_gap);
  }
  

  // Computes the hole height based on hole diameter and bottle height.  
  getHoleHeight(override, holeDiameter, bottleHeight) {
    if (override !== null && override !== undefined) return override;

    if (bottleHeight > 80 && bottleHeight <= 130) return 21;
    if (bottleHeight < 60) return 14;

    return holeDiameter * 1.1;
  }

    
    // Computes the first tier extrusion distance based on hole height.
    getFirstTierExtrusionDistance(override, holeHeight) {
      if (override !== null && override !== undefined) return override;
  
      if (holeHeight >= 16) return 24;
      if (holeHeight < 16) return 19;
  
      return holeHeight + 5;
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
      row_1_hole_height: this.row_1_hole_height,
      row_1_hole_horizontal_constraint: this.row_1_hole_horizontal_constraint,
      row_1_hole_vertical_constraint: this.row_1_hole_vertical_constraint,
      row_1_rectangular_repeat_pattern_distance: this.row_1_rectangular_repeat_pattern_distance,
    };
  }
}

// Styled Components
const GridLayout = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  grid-template-columns: 2fr 2fr 3fr;
  grid-template-rows: 100px 1fr 100px;
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer";
`;

const Header = styled.header`
  grid-area: header;
  background: grey;
  outline: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Footer = styled.footer`
  grid-area: footer;
  background: grey;
  outline: 3px solid black;
`;

const LeftPanel = styled.div`
  grid-area: left;
  background: white;
  outline: 3px solid black;
  display: flex;
  flex-direction: column; 
  justify-content: center;
  padding: 10px;
`;

const ModelInput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-end;
`;

const Input = styled.input`
  width: 50px;
`;

const RightPanel = styled.div`
  color: black;
  grid-area: right;
  background: white;
  outline: 3px solid black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
`;

const ModelOutput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-start;
`;

const CenterPanel = styled.div`
  grid-area: center;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: 3px solid black;
`;

const Model = styled.div`
  background: red;
  width: ${({ model_width }) => model_width}px;
  height: ${({ model_depth }) => model_depth}px;
  outline: 1px solid black;
`;

const Row1 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  outline: 1px solid black;
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;

 

`;

const Row2 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  outline: 1px solid black;
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;
`;

const Row3 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  outline: 1px solid black;
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;
`;

const Hole = styled.div`
  background: darkgrey;
  width: ${({ diameter }) => diameter}px;
  height: ${({ diameter }) => diameter}px;
  outline: 1px solid black;
  box-shadow: inset 0 0 10px black; /* Inner shadow for depth */
`;

const formatNumber = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "N/A"; 
  return (Math.ceil(value * 10) / 10).toFixed(1);  // Round up to nearest 0.1 mm
};

const GridPreview = () => {

  const [userConfig, setUserConfig] = useAtom(baseModelConfigAtom);
  const [modelConfig] = useAtom(modelConfigAtom); // Auto-updated values

  const updateModelWidth = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      model_width: parseInt(e.target.value) || 0, // Ensure it's a number
    }));
  };

  const updateModelDepth = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      model_depth: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow1Depth = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_1_depth: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow2Depth = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_2_depth: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow3Depth = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_3_depth: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow1HoleDiameter = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_1_hole_diameter: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow2HoleDiameter = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_2_hole_diameter: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow3HoleDiameter = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_3_hole_diameter: parseInt(e.target.value) || 0,
    }));
  };

  return (
    <GridLayout>
      <Header>
        <h1>HolderForge</h1>
      </Header>
      <LeftPanel>
        <ModelInput>
          <span>Model Width (mm)</span>
          <Input type="number" value={modelConfig.model_width} onChange={updateModelWidth} />
        </ModelInput>
        <ModelInput>
          <span>Model Depth (mm)</span>
          <Input type="number" value={modelConfig.model_depth} onChange={updateModelDepth} />
        </ModelInput>
        <ModelInput>
          <span>Row 1 Hole Diameter (mm)</span>
          <Input type="number" value={modelConfig.row_1_hole_diameter} onChange={updateRow1HoleDiameter} />
        </ModelInput>
        <ModelInput>
          <span>Row 2 Hole Diameter (mm)</span>
          <Input type="number" value={modelConfig.row_2_hole_diameter} onChange={updateRow2HoleDiameter} />
        </ModelInput>
        <ModelInput>
          <span>Row 3 Hole Diameter (mm)</span>
          <Input type="number" value={modelConfig.row_3_hole_diameter} onChange={updateRow3HoleDiameter} />
        </ModelInput>
      </LeftPanel>
      <CenterPanel>
        <Model
            model_width={modelConfig.model_width * modelConfig.mm2pixel}
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
        >
          <Row1 depth={modelConfig.row_1_depth * modelConfig.mm2pixel} 
                paddingLeftRight={modelConfig.row_1_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_1_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_1_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
          </Row1>
          <Row2 depth={modelConfig.row_2_depth * modelConfig.mm2pixel}
                paddingLeftRight={modelConfig.row_2_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_2_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_2_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
          </Row2>  
          <Row3 depth={modelConfig.row_3_depth * modelConfig.mm2pixel} 
                paddingLeftRight={modelConfig.row_3_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_3_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_3_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
          </Row3>
        </Model>
      </CenterPanel>
      <RightPanel>
        <h3>Computed Values</h3>
        <ModelOutput>
          <span>Row 1 Depth: </span>
          <span>{formatNumber(modelConfig.row_1_depth)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 Depth: </span>
          <span>{formatNumber(modelConfig.row_2_depth)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 Depth: </span>
          <span>{formatNumber(modelConfig.row_3_depth)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 Padding Top-Bottom: </span>
          <span>{formatNumber(modelConfig.row_1_padding_top_bottom)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 Padding Top-Bottom: </span>
          <span>{formatNumber(modelConfig.row_2_padding_top_bottom)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 Padding Top-Bottom: </span>
          <span>{formatNumber(modelConfig.row_3_padding_top_bottom)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 Padding Left-Right: </span>
          <span>{formatNumber(modelConfig.row_1_padding_left_right)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 Padding Left-Right:</span>
          <span>{formatNumber(modelConfig.row_2_padding_left_right)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 Padding Left-Right: </span>
          <span>{formatNumber(modelConfig.row_3_padding_left_right)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 Inner Gap: </span>
          <span>{formatNumber(modelConfig.row_1_inner_gap)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 Inner Gap: </span>
          <span>{formatNumber(modelConfig.row_2_inner_gap)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 Inner Gap: </span>
          <span>{formatNumber(modelConfig.row_3_inner_gap)} mm</span>
        </ModelOutput>

        <h3>AutoFusion360 Computed Values</h3>
        <ModelOutput>
          <span>Model bottom rectangle dimensions: </span>
          <span>{formatNumber(modelConfig.model_width)} mm x {formatNumber(modelConfig.model_depth)} </span>
        </ModelOutput>
        <ModelOutput>
          <span>First tier extrusion distance: </span>
          <span>{formatNumber(modelConfig.tier_1_extrusion_distance)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 hole height (negative extrusion distance): </span>
          <span>{formatNumber(modelConfig.row_1_hole_height)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 hole horizontal constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_1_hole_horizontal_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 hole vertical constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_1_hole_vertical_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 1 rectangular repeat pattern distance: </span>
          <span>{formatNumber(modelConfig.row_1_rectangular_repeat_pattern_distance)} mm </span>
        </ModelOutput>




      </RightPanel>  
      <Footer />
    </GridLayout>
  );
};

export default GridPreview;