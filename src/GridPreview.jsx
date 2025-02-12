import React, { useState } from "react";
import styled from "styled-components";
import { atom, useAtom } from "jotai";
import { pythonTemplate } from "./template"; // Import the Python template
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {CSG} from "three-csg-ts";
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import { cube } from '@jscad/modeling/src/primitives';
import { serialize } from '@jscad/stl-serializer';
import { prepareRender, drawCommands, cameras, entitiesFromSolids } from '@jscad/regl-renderer';
import { cuboid, cylinder, roundedCuboid, roundedRectangle } from "@jscad/modeling/src/primitives"; // Import cuboid
import { subtract } from "@jscad/modeling/src/operations/booleans";
import { union } from "@jscad/modeling/src/operations/booleans";
import { translate } from "@jscad/modeling/src/operations/transforms";
import { roundEdges } from '@jscad/modeling/src/operations/modifiers';
import { measureBounds } from '@jscad/modeling/src/measurements';
import { geom3 } from '@jscad/modeling/src/geometries';
import { extrudeLinear } from '@jscad/modeling/src/operations/extrusions'




const breakpoints = {
  laptop: '1250px',
  largeTablet: '900px',
  smallTablet: '700px',
  mobile: '500px',
};

// Styled Components
const GridLayout = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  
  overflow-x: hidden;   


  grid-template-columns: 3fr 5fr 5fr;
  grid-template-rows: 100px 1fr 100px;
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer";

  /* Large Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    grid-template-columns: 5fr 6fr;
    grid-template-rows: auto 1fr auto 50px;
    grid-template-areas:
      "header header"
      "left center"
      "right center"
      "footer footer";
  }

      /* Mobile <900*/
  @media (max-width: ${breakpoints.largeTablet}) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto 100px;
    grid-template-areas:
      "header"
      "left"
      "center"
      "right"
      "footer";
  }
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
  //outline: 1px solid black;
  
  color: black;
  grid-area: left;
  background: white;
  display: flex;
  flex-direction: column; 
  justify-content: flex-start;
  align-items: flex-end;
  padding-right: 10px;
  padding-top:20px;

  /* Large Tablet (900-1250) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    align-items: flex-start;
    padding-left: 50px;
  }

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    align-items: flex-start;
    padding-left: 20px;
  }
`;

const ModelInput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-end;
  padding-bottom:7px;
  font-size: 14px;
  font-weight: bold;

  span:first-child {
    margin-right: 6px; 
    font-weight: bold; 
  }

`;

const Input = styled.input`
  width: 50px;
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

  /* Tablet (900-1250) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 20px;
      padding-right: 150px;
  }

  /* Large Tablet (700-900) */
  @media (min-width: ${breakpoints.smallTablet}) and (max-width: ${breakpoints.largeTablet}) {
    align-items: flex-start;
    padding-left: 20px;
    padding-right: 20px;
  }

  /* Small Tablet (500-700) */
  @media (min-width: ${breakpoints.mobile}) and (max-width: ${breakpoints.smallTablet}) {
    align-items: flex-start;
    padding-right: 20px;
    h2{
      padding-left: 20px;
    }
  }
    
  /* Mobile (<500) */
  @media (max-width: ${breakpoints.mobile}) {
    align-items: flex-start;
    padding-right: 20px;
    h2{
      padding-left: 20px;
    }
  }

`;

const Model = styled.div`
  background: red;
  width: ${({ model_width }) => model_width}px;
  height: ${({ model_depth }) => model_depth}px;
  outline: 1px solid black;
  margin: 20px;

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    
    margin-left: auto;
    margin-right: auto;
  }
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

  position: relative; /* Ensure children are positioned relative to this */
  overflow: hidden; /* Ensure it doesn't interfere */

  border-sizing: border-box;
  border-bottom: 1px solid black;
  border-right: 1px solid black;


  /* Large Tablet (900-1250) */
  @media (max-width: ${breakpoints.largeTablet}) {
    
    margin-left: auto;
    margin-right: auto;
  }
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

const JscadContainer = styled.div`
  width: min(100%, 400px);
  border-sizing: border-box;
  aspect-ratio: 1 / 1; /* Ensures height always matches width */  
  background: white; /* Ensures the container matches scene background */
  margin-top: 20px;


  /* Large Tablet (900-1250) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    margin-left: auto;
    margin-right: auto;
    padding-left: auto;
    padding-right: auto;
  }


  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    margin-left: auto;
    margin-right: auto;
    padding-left: auto;
    padding-right: auto;
  }


`;


const RightPanel = styled.div`
  
  //outline: 1px solid black;
  
  
  color: black;
  grid-area: right;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0px;
  padding-left: 10px;
  padding-top:20px;

  /* LargeTablet (900-1250px) */
  @media (max-width: ${breakpoints.largeTablet} and max-width: ${breakpoints.laptop}) {
    flex-wrap: wrap;
    padding-left: 20px;
    padding-top: 0px;
  }

    /* Large Tablet (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    flex-wrap: wrap;
    padding-left: 20px;
    padding-top: 0px;
  }

  
`;

const DownloadDiv = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;

  /* Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 40px; 
  }
`;

const DownloadButton = styled.button`
  padding: 5px 10px; 
  font-size: 14px; 
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

const ComputedDiv = styled.div`

  /* Large Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 40px; 
  }

`;

const AutodeskDiv = styled.div`

  /* Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 40px; 
      width: 150%;
  }

`;

const ModelOutput = styled.div`
  color: black;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  font-size: 12px;
  span:first-child {
    margin-right: 6px; 
    font-weight: bold; 
  }
`;


const ModelOutputLabel = styled.span`
  color: black;
  font-size: 12px;
`;


const ModelOutputValue = styled.span`
  color: black;
  font-size: 12px;
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


const formatNumber = (value) => {
  if (typeof value !== "number" || isNaN(value)) return "N/A"; 
  return (Math.ceil(value * 10) / 10).toFixed(1);  // Round up to nearest 0.1 mm
};

const JscadViewer = ({ setExportScene, setStlURL, modelConfig }) => {
  const mountRef = useRef(null);

  // generateSTL inside JscadViewer
  const generateSTL = (jscadModel) => {
    if (!jscadModel) return null;

    // Convert to STL format (binary)
    const rawData = serialize({ binary: true }, [jscadModel]);

    // Create a Blob URL
    const blob = new Blob(rawData, { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    console.log("Generated STL URL:", url); // Debugging
    setStlURL(url); // Pass STL URL to parent component
    return url;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    

      // Clear previous canvas to prevent duplicates
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }


    try {

      console.log("Model Width:", modelConfig.model_width);
      console.log("Model Depth:", modelConfig.model_depth);

      /////////////////////////////////////////////
      //  CREATE GEOMETRY 
      /////////////////////////////////////////////

   
      /////////////////////////////////////////////
      //  Tier 1 / Row 1
      /////////////////////////////////////////////

      // Create a rectangular representation (base) for tier / row 1
      const baseShape = roundedRectangle({
        size: [modelConfig.model_width, modelConfig.model_depth],
        roundRadius: modelConfig.model_chamfer, // Adjust this for corner rounding
        segments: 32
      });
      
      const base = extrudeLinear({ height: modelConfig.tier_1_extrusion_distance }, baseShape);

      // Create a single hole for row 1
      let row1Hole;
      if (modelConfig.row_1_hole_shape === "square") {
        row1Hole = cuboid({
          size: [
            modelConfig.row_1_hole_diameter,  // width (using diameter for square size)
            modelConfig.row_1_hole_diameter,  // depth (same as width for square)
            modelConfig.row_1_hole_height     // height (same as before)
          ]
        });
      } else {
        row1Hole = cylinder({
          height: modelConfig.row_1_hole_height, 
          radius: modelConfig.row_1_hole_diameter / 2,
          segments: 32
        });
    }

      const row1holePositionX =  -modelConfig.model_width / 2 + modelConfig.row_1_hole_horizontal_constraint // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
      const row1holePositionY = -modelConfig.model_depth / 2 +  modelConfig.row_1_hole_vertical_constraint // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2
      const row1holePositionZ =  modelConfig.tier_1_extrusion_distance - modelConfig.row_1_hole_height / 2 // Z position: 0 is bottom, positive is up, negative is down

      // Position the hole visually first. Position refers to center of circle
      const row1HolePositioned = translate([
        row1holePositionX, // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
        row1holePositionY, // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2, 
        row1holePositionZ, // Z position: 0 is bottom, positive is up, negative is down
      ], row1Hole);

      // Create holes using the gap distance
      const row1Holes = [];
      row1Holes.push(row1HolePositioned);

      for(let i = 1; i<5; i++) {

        // Calculate the x position for this hole
        const holeX = row1holePositionX + (modelConfig.row_1_hole_diameter * i) + (modelConfig.row_1_inner_gap * i);

        // Create the hole
        let hole;
        if (modelConfig.row_1_hole_shape === "square") {
          hole = cuboid({
            size: [
              modelConfig.row_1_hole_diameter,  // width (using diameter for square size)
              modelConfig.row_1_hole_diameter,  // depth (same as width for square)
              modelConfig.row_1_hole_height     // height (same as before)
            ]
          });
        } else {
          hole = cylinder({
            height: modelConfig.row_1_hole_height, 
            radius: modelConfig.row_1_hole_diameter / 2,
            segments: 32
          });
      }

        // Position the cylinder
        const positionedHole = translate(
          [
            holeX,                  // X position moves by gap distance each time
            row1holePositionY,    // Y position stays the same
            row1holePositionZ     // Z position stays the same
          ],
          hole
        );
        
        // Add this hole to our array
        row1Holes.push(positionedHole);
      }

      // Subtract row 1 holes from base geometry
      let geometry = subtract(base, ...row1Holes);



      /////////////////////////////////////////////
      //  Tier 2 / Row 2
      /////////////////////////////////////////////

      // Create tier 2 / row 2 rectangular base
      const base2 = roundedRectangle({
        size: [modelConfig.model_width, modelConfig.tier_2_total_depth],
        roundRadius: modelConfig.model_chamfer, // Adjust this for corner rounding
        segments: 32
      });

      const tier2Base = extrudeLinear({ height: modelConfig.tier_2_extrusion_distance }, base2);

      // Position tier2 on top of first tier and toward back
      const tier2Positioned = translate([
        0,                                              // Center X (same as base)
        modelConfig.model_depth/2 - modelConfig.tier_2_total_depth/2,  // Y position (align with back)
        modelConfig.tier_1_extrusion_distance // Z position (top of first tier)
      ], tier2Base);

      // Union tier2 with our base geometry to create a single solid
      geometry = union(geometry, tier2Positioned);

      // Create a single hole for row 2
      let row2Hole;
      if (modelConfig.row_2_hole_shape === "square") {
        row2Hole = cuboid({
          size: [
            modelConfig.row_2_hole_diameter,  // width (using diameter for square size)
            modelConfig.row_2_hole_diameter,  // depth (same as width for square)
            modelConfig.row_2_hole_height     // height (same as before)
          ]
        });
      } else {
        row2Hole = cylinder({
          height: modelConfig.row_2_hole_height, 
          radius: modelConfig.row_2_hole_diameter / 2,
          segments: 32
        });
    }

      const row2holePositionX =  -modelConfig.model_width / 2 + modelConfig.row_2_hole_horizontal_constraint // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
      const row2holePositionY = -modelConfig.model_depth / 2 + modelConfig.row_1_depth + modelConfig.row_2_hole_vertical_constraint // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2
      const row2holePositionZ =  modelConfig.tier_1_extrusion_distance + modelConfig.tier_2_extrusion_distance - modelConfig.row_2_hole_height / 2 // Z position: 0 is bottom, positive is up, negative is down


      // Position the hole visually first. Position refers to center of circle
      const row2HolePositioned = translate([
        row2holePositionX, // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
        row2holePositionY, // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2, 
        row2holePositionZ, // Z position: 0 is center, positive is up, negative is down
      ], row2Hole);

      const row2Holes = [];
      row2Holes.push(row2HolePositioned);

      for(let i = 1; i<5; i++) {

        // Calculate the x position for this hole
        const holeX = row2holePositionX + (modelConfig.row_2_hole_diameter * i) + (modelConfig.row_2_inner_gap * i);

        // Create the hole
        let hole;
        if (modelConfig.row_2_hole_shape === "square") {
          hole = cuboid({
            size: [
              modelConfig.row_2_hole_diameter,  // width (using diameter for square size)
              modelConfig.row_2_hole_diameter,  // depth (same as width for square)
              modelConfig.row_2_hole_height     // height (same as before)
            ]
          });
        } else {
          hole = cylinder({
            height: modelConfig.row_2_hole_height, 
            radius: modelConfig.row_2_hole_diameter / 2,
            segments: 32
          });
      }

        // Position the cylinder
        const positionedHole = translate(
          [
            holeX,                  // X position moves by gap distance each time
            row2holePositionY,    // Y position stays the same
            row2holePositionZ     // Z position stays the same
          ],
          hole
        );
        
        // Add this hole to our array
        row2Holes.push(positionedHole);
      }

      geometry = subtract(geometry, ...row2Holes);

      /////////////////////////////////////////////
      //  Tier 3 / Row 3
      /////////////////////////////////////////////
      
      // Create row 3 / tier 3 base
      const base3 = roundedRectangle({
        size: [modelConfig.model_width, modelConfig.tier_3_total_depth],
        roundRadius: modelConfig.model_chamfer, // Adjust this for corner rounding
        segments: 32
      });

      const tier3Base = extrudeLinear({ height: modelConfig.tier_3_extrusion_distance }, base3);

      // Position tier 3 on top of second tier and toward back
      const tier3Positioned = translate([
        0,                                              // Center X (same as base)
        modelConfig.model_depth / 2 - modelConfig.tier_3_depth / 2,  // Y position (align with back)
        modelConfig.tier_1_extrusion_distance + modelConfig.tier_2_extrusion_distance   // Z position (top of first tier)
      ], tier3Base);

      // Union tier3 with our base geometry to create a single solid
      geometry = union(geometry, tier3Positioned);

      // Create a single hole for row 3
      let row3Hole;
      if (modelConfig.row_3_hole_shape === "square") {
        row3Hole = cuboid({
          size: [
            modelConfig.row_3_hole_diameter,  // width (using diameter for square size)
            modelConfig.row_3_hole_diameter,  // depth (same as width for square)
            modelConfig.row_3_hole_height     // height (same as before)
          ]
        });
      } else {
        row3Hole = cylinder({
          height: modelConfig.row_3_hole_height, 
          radius: modelConfig.row_3_hole_diameter / 2,
          segments: 32
        });
    }

      const row3holePositionX =  -modelConfig.model_width / 2 + modelConfig.row_3_hole_horizontal_constraint // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
      const row3holePositionY = -modelConfig.model_depth / 2 + modelConfig.row_1_depth + modelConfig.row_2_depth + modelConfig.row_3_hole_vertical_constraint // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2
      const row3holePositionZ =  modelConfig.tier_1_extrusion_distance + modelConfig.tier_2_extrusion_distance + modelConfig.tier_3_extrusion_distance - modelConfig.row_3_hole_height / 2 // Z position: 0 is bottom, positive is up, negative is down


      // Position the hole visually first. Position refers to center of circle
      const row3HolePositioned = translate([
        row3holePositionX, // X position: 0 is center, positive is right, negative is left. Left Edge: -model width / 2, Right Edge: model width / 2
        row3holePositionY, // Y position: 0 is center, positive is up, negative is down. Bottom Edge: -model depth / 2, Top Edge: model depth / 2, 
        row3holePositionZ, // Z position: 0 is center, positive is up, negative is down
      ], row3Hole);

      const row3Holes = [];
      row3Holes.push(row3HolePositioned);

      for(let i = 1; i<5; i++) {

        // Calculate the x position for this hole
        const holeX = row3holePositionX + (modelConfig.row_3_hole_diameter * i) + (modelConfig.row_3_inner_gap * i);

        // Create the hole
        let hole;
        if (modelConfig.row_3_hole_shape === "square") {
          hole = cuboid({
            size: [
              modelConfig.row_3_hole_diameter,  // width (using diameter for square size)
              modelConfig.row_3_hole_diameter,  // depth (same as width for square)
              modelConfig.row_3_hole_height     // height (same as before)
            ]
          });
        } else {
          hole = cylinder({
            height: modelConfig.row_3_hole_height, 
            radius: modelConfig.row_3_hole_diameter / 2,
            segments: 32
          });
      }

        // Position the cylinder
        const positionedHole = translate(
          [
            holeX,                  // X position moves by gap distance each time
            row3holePositionY,    // Y position stays the same
            row3holePositionZ     // Z position stays the same
          ],
          hole
        );
        
        // Add this hole to our array
        row3Holes.push(positionedHole);
      }

      geometry = subtract(geometry, ...row3Holes);









      setExportScene(geometry);

      // Generate STL for Three.js rendering
      const stlURL = generateSTL(geometry);
      console.log("STL URL:", stlURL); // Debugging log
      

      // Initialize the JSCAD camera 
      const perspectiveCamera = cameras.perspective;
      const camera = Object.assign({}, perspectiveCamera.defaults);
      perspectiveCamera.setProjection(camera, camera, { width: 400, height: 400 });
      camera.position = [0, -400, 400]; 
      camera.up = [0, 1, 0];  
      camera.target = [0, 0, 0]; 
      perspectiveCamera.update(camera, camera);
      console.log("JSCAD Camera Position:", camera.position);
      console.log("JSCAD Camera Target:", camera.target);

      // Create complete options object
      const options = {
        glOptions: { container: mountRef.current },
        camera,
        drawCommands: {
          drawMesh: drawCommands.drawMesh
        },
        entities: [
          // Add grid
          {
            visuals: {
              drawCmd: 'drawGrid',
              show: true
            },
            size: [200, 200],
            ticks: [25, 5]
          },
          // Add axis
          {
            visuals: {
              drawCmd: 'drawAxis',
              show: true
            },
            size: 150
          },
          // Add our geometry
          ...entitiesFromSolids({}, geometry)
        ]
      };

      // Create and call the renderer
      const render = prepareRender(options);
      render(options);

    } catch (error) {
      console.error('JSCAD Render Error:', error);
    }
  }, [setExportScene, modelConfig]);

  return <div ref={mountRef} style={{ width: "400px", height: "400px", background: "#eee" }} />;
};


const ThreeJSViewer = ({ stlURL }) => {
  const mountRef = useRef(null);
  console.log("Attempting to load STL from:", stlURL); // Debug: Confirm STL URL is passed

  useEffect(() => {
    if (!mountRef.current || !stlURL) return;

    console.log("Attempting to load STL from:", stlURL); // Debug: Confirm STL URL is passed

    // Colors
    const white = 0xffffff;
    const grey = 0xd3d3d3;
    
    // Create Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(white);

    // Set up camera 
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 200, 200);
    camera.lookAt(0, 0, 50);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.DirectionalLight(white, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = false;
    controls.enableDamping = true;



    // Load STL Model
    const loader = new STLLoader();
    loader.load(stlURL, (geometry) => {
      const material = new THREE.MeshStandardMaterial({ color: grey, roughness: 0.6 });
      const mesh = new THREE.Mesh(geometry, material);

      // Center the model
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      mesh.rotation.x = -Math.PI / 2; // Rotate STL to match JSCAD/CAD coordinate system
      mesh.position.set(-center.x, -center.y, -center.z);


      scene.add(mesh);
    });

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [stlURL]);

  return <div ref={mountRef} style={{ width: "400px", height: "400px", background: "#eee" }} />;
};

const GridPreview = () => {

  const [userConfig, setUserConfig] = useAtom(baseModelConfigAtom);
  const [modelConfig] = useAtom(modelConfigAtom); // Auto-updated values
  const [exportScene, setExportScene] = useState(null); // Scene reference stored in state
  const [stlURL, setStlURL] = useState(null); // STL URL for Three.js

  useEffect(() => {
    document.title = "HolderForge"; 
  }, []);

  const generatePythonFile = () => {
  
  
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
      .replace("{{input_row_1_padding_left_right}}", modelConfig.row_1_padding_left_right/10)
      .replace("{{input_row_1_padding_top_bottom}}", modelConfig.row_1_padding_top_bottom/10)
      .replace("{{input_row_1_hole_shape}}", modelConfig.row_1_hole_shape)
      .replace("{{input_tier_2_total_depth}}", modelConfig.tier_2_total_depth/10)
      .replace("{{input_tier_2_extrusion_distance}}", modelConfig.tier_2_extrusion_distance/10)
      .replace("{{input_row_2_hole_diameter}}", modelConfig.row_2_hole_diameter/10)
      .replace("{{input_row_2_hole_horizontal_constraint}}", modelConfig.row_2_hole_horizontal_constraint/10)
      .replace("{{input_row_2_hole_vertical_constraint}}", modelConfig.row_2_hole_vertical_constraint/10)
      .replace("{{input_row_2_hole_height}}", modelConfig.row_2_hole_height/10)
      .replace("{{input_row_2_rectangular_repeat_pattern_distance}}", modelConfig.row_2_rectangular_repeat_pattern_distance/10)
      .replace("{{input_row_2_padding_left_right}}", modelConfig.row_2_padding_left_right/10)
      .replace("{{input_row_2_padding_top_bottom}}", modelConfig.row_2_padding_top_bottom/10)
      .replace("{{input_row_2_hole_shape}}", modelConfig.row_2_hole_shape)
      .replace("{{input_tier_3_total_depth}}", modelConfig.tier_3_depth/10)
      .replace("{{input_tier_3_extrusion_distance}}", modelConfig.tier_3_extrusion_distance/10)
      .replace("{{input_row_3_hole_diameter}}", modelConfig.row_3_hole_diameter/10)
      .replace("{{input_row_3_hole_horizontal_constraint}}", modelConfig.row_3_hole_horizontal_constraint/10)
      .replace("{{input_row_3_hole_vertical_constraint}}", modelConfig.row_3_hole_vertical_constraint/10)
      .replace("{{input_row_3_hole_height}}", modelConfig.row_3_hole_height/10)
      .replace("{{input_row_3_rectangular_repeat_pattern_distance}}", modelConfig.row_3_rectangular_repeat_pattern_distance/10) 
      .replace("{{input_row_3_padding_left_right}}", modelConfig.row_3_padding_left_right/10)
      .replace("{{input_row_3_padding_top_bottom}}", modelConfig.row_3_padding_top_bottom/10)
      .replace("{{input_row_3_hole_shape}}", modelConfig.row_3_hole_shape)   

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



  const downloadSTLFile = () => {
    if (!stlURL) {
      console.warn("No STL file available for download.");
      return;
    }
  
    const a = document.createElement("a");
    a.href = stlURL;
    a.download = "model.stl"; // Default filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  
    console.log(" Downloading STL file:", stlURL); // Debugging
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
        <h2>Customize</h2>
        <ModelInput>
          <span>Model Width (mm)</span>
          <Input type="number" value={modelConfig.model_width} onChange={updateModelWidth} />
        </ModelInput>
        <ModelInput>
          <span>Model Depth (mm)</span>
          <Input type="number" value={modelConfig.model_depth} onChange={updateModelDepth} />
        </ModelInput>
        <ModelInput>
          <span>Row 1 Hole Shape</span>
          <select value={modelConfig.row_1_hole_shape} onChange={updateRow1HoleShape}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </ModelInput>
        <ModelInput>
          <span>Row 2 Hole Shape</span>
          <select value={modelConfig.row_2_hole_shape} onChange={updateRow2HoleShape}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </ModelInput>
        <ModelInput>
          <span>Row 3 Hole Shape</span>
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
        <h2>Preview</h2>
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
            tier_depth={modelConfig.tier_2_total_depth * modelConfig.mm2pixel}
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
            tier_depth={modelConfig.tier_1_total_depth * modelConfig.mm2pixel}
            tier_extrusion_distance={modelConfig.tier_1_extrusion_distance * modelConfig.mm2pixel}
          >
            <ModelProfileHole
              hole_height={modelConfig.row_1_hole_height * modelConfig.mm2pixel}
              hole_diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel}
              tier_row_padding_top_bottom={modelConfig.row_1_padding_top_bottom * modelConfig.mm2pixel}
            />
          </ModelProfileTier>  
        </ModelProfile>
        <h2>JSCAD Viewer</h2>
        <JscadViewer setExportScene={setExportScene} setStlURL={setStlURL} modelConfig={modelConfig} />
        <h2>Three.js STL Viewer</h2>
        <ThreeJSViewer stlURL={stlURL} />
      </CenterPanel>
      <RightPanel>
        <DownloadDiv>
          <h2>Download</h2>
          <DownloadButton onClick={generatePythonFile}>Download Autodesk Fusion Python File</DownloadButton>
          <DownloadButton onClick={downloadSTLFile} style={{ marginTop: "10px" }}>Download STL File</DownloadButton>
        </DownloadDiv>
        <ComputedDiv>
          <h2>Computed Values</h2>
          <ModelOutput>
            <span>Row 1 Depth:</span>
            <span>{formatNumber(modelConfig.row_1_depth)} mm</span>
          </ModelOutput>
          <ModelOutput>
            <ModelOutputLabel>Row 2 Depth:</ModelOutputLabel>
            <ModelOutputValue>{formatNumber(modelConfig.row_2_depth)} mm</ModelOutputValue>
          </ModelOutput>
          <ModelOutput>
            <span>Row 3 Depth: </span>
            <span>{formatNumber(modelConfig.row_3_depth)} mm</span>
          </ModelOutput>
          <ModelOutput>
            <span>Row 1 Padding Top-Bottom:</span>
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
        </ComputedDiv>
        <AutodeskDiv>
          <h2>Autodesk Fusion Computed Values</h2>
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
        </AutodeskDiv>
      </RightPanel>  
      <Footer />
    </GridLayout>
  );
};

export default GridPreview;