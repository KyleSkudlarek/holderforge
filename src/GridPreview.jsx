import React from "react";
import styled from "styled-components";
import { atom, useAtom } from "jotai";
import { pythonTemplate } from "./template"; // Import the Python template
import { useEffect } from "react";

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
  background: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 40px;
  color: black;
`;

const Footer = styled.footer`
  grid-area: footer;
  background: white;
`;

const LeftPanel = styled.div`
  color: black;
  grid-area: left;
  background: white;
  display: flex;
  flex-direction: column; 
  justify-content: flex-start;
  align-items: flex-end;
  padding-right: 10px;
  padding-top:20px;
`;

const ModelInput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-end;
  padding-bottom:7px;
  font-size: 14px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 50px;
`;

const RightPanel = styled.div`
  color: black;
  grid-area: right;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0px;
  padding-left: 10px;
  padding-top:20px;
`;

const ModelOutput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-start;
  font-size: 12px;
  span:first-child {
    margin-right: 6px; /* ✅ Ensures space between label and value */
    font-weight: bold; /* Optional: Makes label stand out */
  }
`;

const CenterPanel = styled.div`
  color:black;
  grid-area: center;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top:20px;
`;

const Model = styled.div`
  background: red;
  width: ${({ model_width }) => model_width}px;
  height: ${({ model_depth }) => model_depth}px;
  outline: 1px solid black;
  margin: 20px;
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
  border-radius: ${({ shape }) => (shape === "circle" ? "50%" : "0")}; 
`;


const ModelProfile = styled.div`

  margin-top: 20px;

  width: ${({ model_depth }) => model_depth}px;
  height: ${({ model_height }) => model_height}px;
  display: flex;
  flex-direction: column;

  border-sizing: border-box;
  border-bottom: 1px solid black;
  border-right: 1px solid black;
`;

const ModelProfileTier = styled.div`
  background: lightgrey;
  width: ${({ tier_depth}) => tier_depth}px;
  height: ${({ tier_extrusion_distance }) => tier_extrusion_distance}px;
  margin-left: ${({ model_depth, tier_depth }) => model_depth - tier_depth}px;
  
  box-sizing: border-box;
  border-left: 1px solid black;
  
`;

const ModelProfileHole = styled.div`
  height: ${({ hole_height }) => hole_height}px;
  width: ${({ hole_diameter }) => hole_diameter}px;
  margin-left: ${({ tier_row_padding_top_bottom }) => tier_row_padding_top_bottom}px;
  background: white;

  border-sizing: border-box;
  border-left: 1px dashed black;
  border-right: 1px dashed black;
  border-bottom: 1px dashed black;

  position: absolute;
  z-index: 10;



  
  /* Left border segment */
  &::before {
    content: '';
    position: absolute;
    left: ${({ tier_row_padding_top_bottom }) => (-1 * tier_row_padding_top_bottom)-1}px;  /* Extend left of hole */
    width: ${({ tier_row_padding_top_bottom }) => tier_row_padding_top_bottom}px;  /* Length of border segment */
    height: 1px;
    background: black;
  }

  /* Right border segment */
  &::after {
    content: '';
    position: absolute;
    right: ${({ tier_row_padding_top_bottom }) => (-1 * tier_row_padding_top_bottom)+1}px;
    width: ${({ tier_row_padding_top_bottom }) => tier_row_padding_top_bottom-1}px;
    height: 1px;
    background: black;
  }
`;

const DownloadButton = styled.button`
  padding: 5px 10px; /* Smaller padding */
  font-size: 14px; /* Adjust text size */
  width: auto; /* Shrinks to fit text */
  min-width: 120px; /* Ensures it doesn't get too small */
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-block;
  width: 300px;

  &:hover {
    background-color: #0056b3;
  }
`;


// State for model - user inputs and system values
const baseModelConfigAtom = atom({
  
  // System values (not editable by user)
  mm2pixel: 2,
  rows: 3,
  number_holes_per_row: 5,
  edge_gap_scale_factor: 1.32,
  model_chamfer: 5,



  // Default values for user inputs
  model_width: 120,
  model_depth: 81,
  row_1_hole_diameter: 19,
  row_2_hole_diameter: 19,
  row_3_hole_diameter: 19,
  row_1_bottle_height: 120,
  row_2_bottle_height: 120,
  row_3_bottle_height: 120,

  row_1_hole_shape: "circle", // Options: "circle" or "square"
  row_2_hole_shape: "circle",
  row_3_hole_shape: "circle",

});

// Getter function for model state - user inputs and calculated values
const modelConfigAtom = atom((get) => {
  // The 'get' function allows us to access other atoms
  const config = get(baseModelConfigAtom);
  
  // Create a new instance of the ModelCalculator class and calculate dimensions with config current state of the BaseModelConfigAtom (config)
  const modelCalculator = new ModelCalculator(config);

  // Return a new object with the original config and the calculated dimensions combined
  return {
    ...config, // Keep user inputs
    ...modelCalculator.getCalculatedModelDimensions(), // Add calculated model dimensions
  };
});

class ModelCalculator {

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
    this.tier_1_extrusion_distance = this.getTier1ExtrusionDistance(null, this.row_1_hole_height);
    this.row_1_hole_horizontal_constraint = this.row_1_padding_left_right + (this.config.row_1_hole_diameter / 2);
    this.row_1_hole_vertical_constraint = this.row_1_padding_top_bottom + (this.config.row_1_hole_diameter / 2);
    this.row_1_rectangular_repeat_pattern_distance = (4 * this.config.row_1_hole_diameter) + ( 4 * this.row_1_inner_gap);


      
    this.row_2_hole_height = this.getHoleHeight(null, this.config.row_2_hole_diameter, this.config.row_2_bottle_height);
    this.tier_2_depth = this.row_2_depth + this.row_3_depth ;
    this.tier_2_extrusion_distance = this.getTier23ExtrusionDistance(null, this.tier_1_extrusion_distance);
    this.row_2_hole_horizontal_constraint = this.row_2_padding_left_right + (this.config.row_2_hole_diameter / 2);
    this.row_2_hole_vertical_constraint = this.row_2_padding_top_bottom + (this.config.row_2_hole_diameter / 2);
    this.row_2_rectangular_repeat_pattern_distance = (4 * this.config.row_2_hole_diameter) + ( 4 * this.row_2_inner_gap);


    this.row_3_hole_height = this.getHoleHeight(null, this.config.row_3_hole_diameter, this.config.row_3_bottle_height);
    this.tier_3_depth = this.row_3_depth ;
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
      row_1_hole_height: this.row_1_hole_height,
      row_1_hole_horizontal_constraint: this.row_1_hole_horizontal_constraint,
      row_1_hole_vertical_constraint: this.row_1_hole_vertical_constraint,
      row_1_rectangular_repeat_pattern_distance: this.row_1_rectangular_repeat_pattern_distance,
      tier_2_depth: this.tier_2_depth,
      tier_2_extrusion_distance: this.tier_2_extrusion_distance,
      row_2_hole_height: this.row_2_hole_height,
      row_2_hole_horizontal_constraint: this.row_2_hole_horizontal_constraint,
      row_2_hole_vertical_constraint: this.row_2_hole_vertical_constraint,
      row_2_rectangular_repeat_pattern_distance: this.row_2_rectangular_repeat_pattern_distance,
      tier_3_depth: this.tier_3_depth,
      tier_3_extrusion_distance: this.tier_3_extrusion_distance,
      row_3_hole_height: this.row_3_hole_height,
      row_3_hole_horizontal_constraint: this.row_3_hole_horizontal_constraint,
      row_3_hole_vertical_constraint: this.row_3_hole_vertical_constraint,
      row_3_rectangular_repeat_pattern_distance: this.row_3_rectangular_repeat_pattern_distance,
      model_height: this.model_height,
    };
  }
}


const formatNumber = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "N/A"; 
  return (Math.ceil(value * 10) / 10).toFixed(1);  // Round up to nearest 0.1 mm
};

const GridPreview = () => {

  const [userConfig, setUserConfig] = useAtom(baseModelConfigAtom);
  const [modelConfig] = useAtom(modelConfigAtom); // Auto-updated values

  useEffect(() => {
    document.title = "HolderForge"; 
  }, []);

  const generatePythonFile = () => {

    console.log("Download button clicked!");
  
  
    // Replace placeholders with actual computed values
    let template = pythonTemplate
      .replace("{{input_model_width}}", modelConfig.model_width/10)
      .replace("{{input_model_depth}}", modelConfig.model_depth/10)
      .replace("{{input_model_fillet_radius}}", modelConfig.model_chamfer/10)
      .replace("{{input_tier_1_extrusion_distance}}", modelConfig.tier_1_extrusion_distance/10)
      .replace("{{input_row_1_hole_diameter}}", modelConfig.row_1_hole_diameter/10)
      .replace("{{input_row_1_hole_horizontal_constraint}}", modelConfig.row_1_hole_horizontal_constraint/10)
      .replace("{{input_row_1_hole_vertical_constraint}}", modelConfig.row_1_hole_vertical_constraint/10)
      .replace("{{input_row_1_hole_height}}", modelConfig.row_1_hole_height/10)
      .replace("{{input_row_1_rectangular_repeat_pattern_distance}}", modelConfig.row_1_rectangular_repeat_pattern_distance/10)
      .replace("{{input_tier_2_total_depth}}", modelConfig.tier_2_depth/10)
      .replace("{{input_tier_2_extrusion_distance}}", modelConfig.tier_2_extrusion_distance/10)
      .replace("{{input_row_2_hole_diameter}}", modelConfig.row_2_hole_diameter/10)
      .replace("{{input_row_2_hole_horizontal_constraint}}", modelConfig.row_2_hole_horizontal_constraint/10)
      .replace("{{input_row_2_hole_vertical_constraint}}", modelConfig.row_2_hole_vertical_constraint/10)
      .replace("{{input_row_2_hole_height}}", modelConfig.row_2_hole_height/10)
      .replace("{{input_row_2_rectangular_repeat_pattern_distance}}", modelConfig.row_2_rectangular_repeat_pattern_distance/10)
      .replace("{{input_tier_3_total_depth}}", modelConfig.tier_3_depth/10)
      .replace("{{input_tier_3_extrusion_distance}}", modelConfig.tier_3_extrusion_distance/10)
      .replace("{{input_row_3_hole_diameter}}", modelConfig.row_3_hole_diameter/10)
      .replace("{{input_row_3_hole_horizontal_constraint}}", modelConfig.row_3_hole_horizontal_constraint/10)
      .replace("{{input_row_3_hole_vertical_constraint}}", modelConfig.row_3_hole_vertical_constraint/10)
      .replace("{{input_row_3_hole_height}}", modelConfig.row_3_hole_height/10)
      .replace("{{input_row_3_rectangular_repeat_pattern_distance}}", modelConfig.row_3_rectangular_repeat_pattern_distance/10)    

    ;
  
    // Create a Blob (file-like object) and generate a downloadable URL
    const blob = new Blob([template], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
  
    // Create a temporary <a> element and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "model_dimensions.py"; // File name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up memory
  };

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

  const updateRow1BottleHeight = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_1_bottle_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow2BottleHeight = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_2_bottle_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow3BottleHeight = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_3_bottle_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow1HoleShape = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_1_hole_shape: e.target.value,
    }));
  };

  const updateRow2HoleShape = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_2_hole_shape: e.target.value,
    }));
  };

  const updateRow3HoleShape = (e) => {
    setUserConfig((prev) => ({
      ...prev,
      row_3_hole_shape: e.target.value,
    }));
  };


  return (
    <GridLayout>
      <Header>
        <h1>HolderForge</h1>
      </Header>
      <LeftPanel>
        <h3>Customize</h3>
        <ModelInput>
          <span>Model Width (mm)</span>
          <Input type="number" value={modelConfig.model_width} onChange={updateModelWidth} />
        </ModelInput>
        <ModelInput>
          <span>Model Depth (mm)</span>
          <Input type="number" value={modelConfig.model_depth} onChange={updateModelDepth} />
        </ModelInput>
        <ModelInput>
          <span>Row 1 Hole Shape:</span>
          <select value={modelConfig.row_1_hole_shape} onChange={updateRow1HoleShape}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </ModelInput>
        <ModelInput>
          <span>Row 2 Hole Shape:</span>
          <select value={modelConfig.row_2_hole_shape} onChange={updateRow2HoleShape}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </ModelInput>
        <ModelInput>
          <span>Row 3 Hole Shape:</span>
          <select value={modelConfig.row_3_hole_shape} onChange={updateRow3HoleShape}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
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
        <ModelInput>
          <span>Row 1 Bottle Height (mm)</span>
          <Input type="number" value={modelConfig.row_1_bottle_height} onChange={updateRow1BottleHeight} />
        </ModelInput>
        <ModelInput>
          <span>Row 2 Bottle Height (mm)</span>
          <Input type="number" value={modelConfig.row_2_bottle_height} onChange={updateRow2BottleHeight} />
        </ModelInput>
        <ModelInput>
          <span>Row 3 Bottle Height (mm)</span>
          <Input type="number" value={modelConfig.row_3_bottle_height} onChange={updateRow3BottleHeight} />
        </ModelInput>
      </LeftPanel>
      <CenterPanel>
        <h3>Preview</h3>
        <Model
            model_width={modelConfig.model_width * modelConfig.mm2pixel}
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
        >
          <Row3 depth={modelConfig.row_3_depth * modelConfig.mm2pixel} 
                paddingLeftRight={modelConfig.row_3_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_3_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_3_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}/>
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}/>
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}/>
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}/>
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}/>
          </Row3>
          <Row2 depth={modelConfig.row_2_depth * modelConfig.mm2pixel}
                paddingLeftRight={modelConfig.row_2_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_2_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_2_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}  />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}/>
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}/>
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}/>
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}/>
          </Row2>
          <Row1 depth={modelConfig.row_1_depth * modelConfig.mm2pixel} 
                paddingLeftRight={modelConfig.row_1_padding_left_right * modelConfig.mm2pixel}
                paddingTopBottom={modelConfig.row_1_padding_top_bottom * modelConfig.mm2pixel}
                holeGap={modelConfig.row_1_inner_gap * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape} />
          </Row1>  

        </Model>

        <ModelProfile
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
            model_height={modelConfig.model_height * modelConfig.mm2pixel}
        >
          <ModelProfileTier
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
            tier_depth={modelConfig.tier_3_depth * modelConfig.mm2pixel}
            tier_extrusion_distance={modelConfig.tier_3_extrusion_distance * modelConfig.mm2pixel}
          >
            <ModelProfileHole
              hole_height={modelConfig.row_3_hole_height * modelConfig.mm2pixel}
              hole_diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel}
              tier_row_padding_top_bottom={modelConfig.row_3_padding_top_bottom * modelConfig.mm2pixel}
            />
          </ModelProfileTier>  
          <ModelProfileTier
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
            tier_depth={modelConfig.tier_2_depth * modelConfig.mm2pixel}
            tier_extrusion_distance={modelConfig.tier_2_extrusion_distance * modelConfig.mm2pixel}
          >
            <ModelProfileHole
              hole_height={modelConfig.row_2_hole_height * modelConfig.mm2pixel}
              hole_diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel}
              tier_row_padding_top_bottom={modelConfig.row_2_padding_top_bottom * modelConfig.mm2pixel}
            />
          </ModelProfileTier>  
          <ModelProfileTier
            model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
            tier_depth={modelConfig.tier_1_depth * modelConfig.mm2pixel}
            tier_extrusion_distance={modelConfig.tier_1_extrusion_distance * modelConfig.mm2pixel}
          >
            <ModelProfileHole
              hole_height={modelConfig.row_1_hole_height * modelConfig.mm2pixel}
              hole_diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel}
              tier_row_padding_top_bottom={modelConfig.row_1_padding_top_bottom * modelConfig.mm2pixel}
            />
          </ModelProfileTier>  
        </ModelProfile>
      </CenterPanel>
      <RightPanel>
        <h3>Download</h3>
        <DownloadButton onClick={generatePythonFile}>Download Autodesk Fusion Python File</DownloadButton>
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

        <h3>Autodesk Fusion Computed Values</h3>
        <ModelOutput>
          <span>Tier 1 rectangle dimensions: </span>
          <span>{formatNumber(modelConfig.model_width)} mm x {formatNumber(modelConfig.model_depth)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Tier 1 extrusion distance: </span>
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
        <ModelOutput>
          <span>Tier 2 rectangle dimensions: </span>
          <span>{formatNumber(modelConfig.model_width)} mm x {formatNumber(modelConfig.tier_2_depth)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Tier 2 extrusion distance: </span>
          <span>{formatNumber(modelConfig.tier_2_extrusion_distance)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 hole height (negative extrusion distance): </span>
          <span>{formatNumber(modelConfig.row_2_hole_height)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 hole horizontal constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_2_hole_horizontal_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 hole vertical constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_2_hole_vertical_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 2 rectangular repeat pattern distance: </span>
          <span>{formatNumber(modelConfig.row_2_rectangular_repeat_pattern_distance)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Tier 3 rectangle dimensions: </span>
          <span>{formatNumber(modelConfig.model_width)} mm x {formatNumber(modelConfig.tier_3_depth)} mm</span>
        </ModelOutput>
        <ModelOutput>
          <span>Tier 3 extrusion distance: </span>
          <span>{formatNumber(modelConfig.tier_3_extrusion_distance)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 hole height (negative extrusion distance): </span>
          <span>{formatNumber(modelConfig.row_3_hole_height)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 hole horizontal constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_3_hole_horizontal_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 hole vertical constraint (hole center to model edge): </span>
          <span>{formatNumber(modelConfig.row_3_hole_vertical_constraint)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Row 3 rectangular repeat pattern distance: </span>
          <span>{formatNumber(modelConfig.row_3_rectangular_repeat_pattern_distance)} mm </span>
        </ModelOutput>
        <ModelOutput>
          <span>Model Chamfer: </span>
          <span>{formatNumber(modelConfig.model_chamfer)} mm </span>
        </ModelOutput>




      </RightPanel>  
      <Footer />
    </GridLayout>
  );
};

export default GridPreview;