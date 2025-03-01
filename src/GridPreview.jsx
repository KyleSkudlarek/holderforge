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
import { Helmet } from "react-helmet";
import Cuboid from './Cuboid'; 





const breakpoints = {
  laptop: '1300px',
  largeTablet: '1000px',
  smallTablet: '700px',
  mobile: '500px',
};

// Styled Components
const GridLayout = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  
  overflow-x: hidden;   


  grid-template-columns: 4fr 5fr 5fr;
  grid-template-rows: auto 1fr 0px;
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer";

  /* Large Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    grid-template-columns: 5fr 6fr;
    grid-template-rows: auto 1fr auto 100px;
    grid-template-areas:
      "header header"
      "left center"
      "right center"
      "right center";
  }

  /* Mobile <900*/
  @media (max-width: ${breakpoints.largeTablet}) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto 0px;
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
  min-height: 90px;


  background: ${({ theme }) => theme.colors.background};
  border-bottom: 8px solid ${({ theme }) => theme.colors.outline};
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding-left: 0px;

  h1 {
    color: ${({ theme }) => theme.colors.headerLogo};
    margin: 0;
    padding-bottom: 0;
    padding-top: 10px;
    padding-left: 20px;
    font-size: 34px;
  }

  h2 {
    color: ${({ theme }) => theme.colors.headerSecondary};
    margin: 0;
    padding: 0;
    font-size: 14px;
    padding-left: 20px;
  }
`;


// NEW: Container for the number input with increment/decrement buttons
const NumberInputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 6px;
  padding-top: 10px;
`;

// NEW: Modified input style specifically for number inputs
const StyledInput = styled.input`
  width: 40px;
  text-align: center;
  -moz-appearance: textfield; /* Firefox */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

// NEW: Button style for increment/decrement buttons
const IncrementButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid ${({ theme }) => theme.colors.outline || '#ccc'};
  background: ${({ theme }) => theme.colors.background || 'white'};
  color: ${({ theme }) => theme.colors.headerSecondary || 'black'};
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none; /* Safari support */
  -webkit-touch-callout: none; /* iOS Safari */
  border-radius: 2px;
  touch-action: manipulation; /* Optimize for touch */
  
  &:hover {
    background: ${({ theme }) => theme.colors.highlightSecondary || '#e0e0e0'};
  }
  
  &:active {
    background: ${({ theme }) => theme.colors.highlightPrimary || '#d0d0d0'};
  }
`;


// NEW: Reusable NumberInput component with increment/decrement buttons
// UPDATED: NumberInput component with continuous increment/decrement on button hold
// UPDATED: Simplified NumberInput component with continuous increment/decrement
const NumberInput = ({ value, onChange, min, max, step = 1 }) => {
  const [intervalId, setIntervalId] = useState(null);
  const currentValueRef = useRef(value);
  
  // Update ref when value changes
  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);
  
  const handleIncrement = () => {
    const currentValue = currentValueRef.current;
    const newValue = Math.min(max || Infinity, parseInt(currentValue) + step);
    onChange({ target: { value: newValue } });
  };

  const handleDecrement = () => {
    const currentValue = currentValueRef.current;
    const newValue = Math.max(min || 0, parseInt(currentValue) - step);
    onChange({ target: { value: newValue } });
  };
  
  const startIncrement = (e) => {
    // Prevent default behavior (text selection, context menu, etc.)
    e.preventDefault();
    
    handleIncrement();
    const id = setInterval(handleIncrement, 150);
    setIntervalId(id);
  };
  
  const startDecrement = (e) => {
    // Prevent default behavior
    e.preventDefault();
    
    handleDecrement();
    const id = setInterval(handleDecrement, 150);
    setIntervalId(id);
  };
  
  const stopContinuous = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <NumberInputContainer>
      <IncrementButton 
        onMouseDown={startDecrement}
        onMouseUp={stopContinuous}
        onMouseLeave={stopContinuous}
        onTouchStart={startDecrement}
        onTouchEnd={stopContinuous}
        onTouchCancel={stopContinuous}
      >
        −
      </IncrementButton>
      <StyledInput 
        type="text"
        value={value} 
        readOnly={true}
      />
      <IncrementButton 
        onMouseDown={startIncrement}
        onMouseUp={stopContinuous}
        onMouseLeave={stopContinuous}
        onTouchStart={startIncrement}
        onTouchEnd={stopContinuous}
        onTouchCancel={stopContinuous}
      >
        +
      </IncrementButton>
    </NumberInputContainer>
  );
};

const Footer = styled.footer`
  grid-area: footer;
  background: ${({ theme }) => theme.colors.background};
`;

const LeftPanel = styled.div`
  background: ${({ theme }) => theme.colors.background};


  h2 {
    color: ${({ theme }) => theme.colors.headerPrimary};
    margin: 0;
    padding: 0;
  }
  
  color: black;
  grid-area: left;
  display: flex;
  flex-direction: column; 
  justify-content: flex-start;
  align-items: flex-end;
  padding-right: 0px;


  /* Large Tablet (900-1250) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    align-items: flex-start;
    padding-right: 0;
    padding-bottom: 20px;
    border-bottom: 4px solid ${({ theme }) => theme.colors.outline};
  }

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    align-items: flex-start;
    padding-bottom: 20px;
    padding-right: 0;
    border-bottom: 4px solid ${({ theme }) => theme.colors.outline};
  }
`;

const BottleInputContainer = styled.div`
  width: 100%;
  border-bottom: 2px solid ${({ theme }) => theme.colors.outline};


  h2 {
    padding-top: 20px;
    padding-left:20px;
    font-size: 20px;

  }
`;

const AccordionContainer = styled.div`
  width: 100%;
  padding-top: 20px;
`;


const AccordionHolderContainer = styled.div`
  width: 100%;
  padding-top: 20px;
`;

const AccordionItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 40px;
  max-height: 450px;
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outline};
  padding-top: 10px;
  padding-bottom: 20px;
  border-sizing: border-box;

  span {
    padding-bottom: 10px;
  }
  
`;

const AccordionHolderItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 20px;
  max-height: 250px;
  background: ${({ theme }) => theme.colors.background};
 
  border-sizing: border-box;

  span {
    padding-bottom: 10px;
  }
  
`;

const ShapeSummaryIcon = styled.div`
  width: 20px;  
  height: 20px;
  display: flex;          
  align-items: center;   
  justify-content: center;


  ${({ shape }) => shape === "circle" && `
    border-radius: 50%;
  `}

  background: ${({ theme }) => theme.colors.headerSecondary};

  margin-left: 5px;
`;


const HolderSummaryIcon = styled.div`
  width: 30px;  
  height: 20px;
  border-radius: 5%;
  display: flex;          
  align-items: center;   
  justify-content: center;

  background: ${({ theme }) => theme.colors.headerSecondary};

  margin-left: 5px;
`;

const AccordionHeader = styled.div`
  width: 100%;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.headerSecondary};
  height: auto;
  min-height: 40px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  padding-right: 40px;

  h3 {
    color: ${({ theme }) => theme.colors.headerSecondary};
    padding: 0;
    padding-left: 40px;
    margin: 0;
    font-size: 16px;
  }
`;

const AccordionHolderHeader = styled.div`
  width: 100%;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.headerSecondary};
  height: auto;
  min-height: 40px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  padding-right: 20px;

  h3 {
    color: ${({ theme }) => theme.colors.headerSecondary};
    padding: 0;
    padding-left: 40px;
    margin: 0;
    font-size: 16px;
  }
`;

const AccordionContent = styled.div`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  flex-direction: row;
  height: 340px;
`;

const AccordionHolderContent = styled.div`
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  flex-direction: row;
  height: 400px;
`;

const AccordionSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.headerSecondary};
`;

const AccordionHolderSummary = styled.div`
  display: flex;
  margin-left: -10px;
  gap: 10px;
  align-items: center;
  color: ${({ theme }) => theme.colors.headerSecondary};
`;



const AccordionItemLeft = styled.div`

  width: 60%;
  color: ${({ theme }) => theme.colors.headerSecondary};
  padding-left: 40px;
  padding-top: 20px;
`;

const AccordionHolderItemLeft = styled.div`

  width: 60%;
  color: ${({ theme }) => theme.colors.headerSecondary};
  padding-left: 20px;
  padding-top: 20px;
`;

const AccordionItemRight = styled.div`

  background: ${({ theme }) => theme.colors.background};
  width: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

`;


const AccordionHolderItemRight = styled.div`

  background: ${({ theme }) => theme.colors.background};
  width: 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

`;


const AutofitButton = styled.button`
  margin-top: 10px;
  padding: 5px 10px;
  background-color: ${({ theme }) => theme.colors.highlightPrimary};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.highlightSecondary};
  }
`;



const BottleThreeContainer = styled.div`
  height: min(100%, 120px);
  aspect-ratio: 1 / 1; /* Ensures height always matches width */
  background: white; /* Ensures the container matches scene background */

`;


const BottlePreviewContainer = styled.div`
  height: min(100%, 120px);
  aspect-ratio: 1 / 1; 
  background: ${({ theme }) => theme.colors.background};
  // outline: 1px solid black;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 60px; /* Alternative approach with padding */

`;


const Rod = styled.div`
  width: ${({ radius }) => radius * 2}px;
  height: ${({ height }) => height}px;
  background: radial-gradient(
      ${({ radius }) => radius}px ${({ radius }) => radius / 2}px ellipse at 50% ${({ radius }) => radius / 2}px, 
      #60a5fa 95%, 
      transparent 100%, 
      transparent
    ),
    #3b82f6;
  border-radius: ${({ radius }) => radius * 2}px / ${({ radius }) => radius}px;

`;


const BottlePreview = ({ modelConfig, rowIndex }) => {
  const diameter = modelConfig[`row_${rowIndex}_hole_diameter`];
  const height = modelConfig[`row_${rowIndex}_bottle_height`];
  const shape = modelConfig[`row_${rowIndex}_hole_shape`];

  return (
    <BottlePreviewContainer>
      {shape === 'square' ? (
        <Cuboid width={diameter} height={height} depth={diameter} />
      ) : (
        <Rod radius={diameter/2} height={height} />
      )}
    </BottlePreviewContainer>
  );
};


const HolderInputContainer = styled.div`
  width: 100%;
  border-top: 4px solid ${({ theme }) => theme.colors.outline};
  border-bottom: 2px solid ${({ theme }) => theme.colors.outline};


  h2 {
    padding-top: 20px;
    padding-left:20px;
    font-size: 20px;

  }
`;


const BottleThreeViewer = ({modelConfig, rowIndex}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);

  

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    const backgroundColor = 0x272727;
    scene.background = new THREE.Color(backgroundColor);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 150);


    // Renderer Setup
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    }

    // Ensure the renderer is attached to the DOM
    if (!mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.appendChild(rendererRef.current.domElement);
    }

    // Use rendererRef.current instead of a new variable
    const renderer = rendererRef.current;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    // Lighting
    const skyColor = 0xffffff; // White Light
    const groundColor = 0xffffff; // White Light
    const light = new THREE.HemisphereLight(skyColor, groundColor, 1);  // First color = sky, Second color = ground reflection
    scene.add(light);
    
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
       
    scene.add(directionalLight);

    // const ambientLight = new THREE.AmbientLight(0xffffff, 1); // soft white light
    // ambientLight.position.set(10, 10, 10);

    // scene.add(ambientLight);



    // Cylinder Geometry (Bottle Shape)
    const shapeKey = `row_${rowIndex}_hole_shape`;
    const diameterKey = `row_${rowIndex}_hole_diameter`;
    const heightKey = `row_${rowIndex}_bottle_height`;


    const shape = modelConfig[shapeKey];
    const diameter = modelConfig[diameterKey];
    const radius = modelConfig[diameterKey] / 2;
    const height = modelConfig[heightKey];

    // Create geometry based on selected shape
    let geometry;
    if (shape === "square") {
      geometry = new THREE.BoxGeometry(diameter, height, diameter);
    } else {
      const radius = diameter / 2;
      geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    }
    
    
    
    
    const bottleColor = 0x006FFF;
    const material = new THREE.MeshStandardMaterial({ 
      color: bottleColor, 
      transparent: true,   
      opacity: 0.47,       // Reduce opacity for a more translucent look
      roughness: 1,     // Lower roughness for a glossier look   
      side: THREE.DoubleSide ,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);




    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [modelConfig]);

  return <BottleThreeContainer ref={mountRef} />;
};



const ModelInput = styled.div`

  color: ${({ theme }) => theme.colors.headerSecondary};

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-bottom:10px;
  font-size: 14px;
  font-weight: bold;

  span:first-child {
    margin-right: 6px; 
    font-weight: bold; 
  }

`;

const Input = styled.input`
  width: 40px;
  margin-left: 6px;
  color: ${({ theme }) => theme.colors.headerSecondary};
`;

const InputRange = styled.input`
  width: 90%;
  color: ${({ theme }) => theme.colors.headerSecondary};

`;

const InputSpan = styled.span`
  margin-right: 6px;
  padding-bottom: 10px;
  color: ${({ theme }) => theme.colors.headerSecondary};
`;


const InputShape = ({ modelConfig, onChange, rowIndex }) => {
  
      // Get row hole shape by rowIndex
      const shapeKey = `row_${rowIndex}_hole_shape`;
      const shape = modelConfig[shapeKey];

  return (
    <ShapeSelector>
      <ShapeOption 
        $selected={shape === "circle"} 
        onClick={() => onChange({ target: { value: "circle" } })}
      >
        <CircleIcon />
      </ShapeOption>

      <ShapeOption 
        $selected={shape === "square"} 
        onClick={() => onChange({ target: { value: "square" } })}
      >
        <SquareIcon />
      </ShapeOption>
    </ShapeSelector>
  );
};


const ShapeSelector = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 5px;
  padding-top: 5px;
  padding-bottom: 5px;
`;

const ShapeOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 5px;
 border: 3px solid ${({ theme, $selected }) => ($selected ? theme.colors.highlightPrimary : theme.colors.secondary)};

  background-color: ${({ $selected }) => ($selected ? "#f8f9fa" : "white")};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme, $selected }) => ($selected ? theme.colors.highlightPrimary : "#0056b3")};
  }
`;


const CircleIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: black;
`;

const SquareIcon = styled.div`
  width: 20px;
  height: 20px;
  background: black;
`;


const HolderModelInputContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
  box-sizing: border-box;

  h3  {
    padding-left: 20px;
  }


  `;

const HolderModelInput = styled.div`
  color: ${({ theme }) => theme.colors.headerSecondary};
  padding-left: 20px;
  padding-bottom: 20px;

`;

const CenterPanel = styled.div`

  h2 {
    color: ${({ theme }) => theme.colors.headerPrimary};
    padding-top: 0;
    margin-top: 0;
  }

  background: ${({ theme }) => theme.colors.black};
  
  grid-area: center;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top:20px;

  border-left: 4px solid ${({ theme }) => theme.colors.outline};
  border-right: 4px solid ${({ theme }) => theme.colors.outline};

  /* Tablet (900-1250) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 20px;
      padding-right: 150px;
      border-left: 4px solid ${({ theme }) => theme.colors.outline};
      border-right: 0px solid ${({ theme }) => theme.colors.outline};
  }

  /* Large Tablet (700-900) */
  @media (min-width: ${breakpoints.smallTablet}) and (max-width: ${breakpoints.largeTablet}) {
    align-items: flex-start;
    border-left: 0px solid ${({ theme }) => theme.colors.outline};
    border-right: 0px solid ${({ theme }) => theme.colors.outline};
    h2{
      padding-left: 20px;
    }
  }

  /* Small Tablet (500-700) */
  @media (min-width: ${breakpoints.mobile}) and (max-width: ${breakpoints.smallTablet}) {
    align-items: flex-start;
    border-left: 0px solid ${({ theme }) => theme.colors.outline};
    border-right: 0px solid ${({ theme }) => theme.colors.outline};
    h2{
      padding-left: 20px;
    }
  }
    
  /* Mobile (<500) */
  @media (max-width: ${breakpoints.mobile}) {
    align-items: flex-start;
    border-left: 0px solid ${({ theme }) => theme.colors.outline};
    border-right: 0px solid ${({ theme }) => theme.colors.outline};
    h2{
      padding-left: 20px;
    }
  }

`;

const ModelContainer = styled.div`
  position: relative;  /* Creates positioning context for sliders */
  width: 100%;
  display: flex;
  justify-content: center;
`;

const ModelWrapper = styled.div`

`;



const Model = styled.div`
  background: lightgrey;
  width: ${({ model_width }) => model_width}px;
  height: ${({ model_depth }) => model_depth}px;
  outline: 2px solid black;
  margin: 20px;
  border-radius: 15px; /* Add this line */


  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    
    margin-left: auto;
    margin-right: auto;
  }

  overflow: hidden; /* Ensure children don't overflow */
  z-index: 0;
  position: relative; /* Ensure z-index works */
`;

const Row1 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  // outline: 1px solid black;
  box-shadow: 0px 4px 3px rgba(0, 0, 0, 0.3); /* Casts shadow over Tier 1 */
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  position: relative; /* Allows z-index to work */
  z-index: 1;

 

`;

const Row2 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  // outline: 1px solid black;
  box-shadow: 0px 5px 3px rgba(0, 0, 0, 0.3); /* Casts shadow over Tier 1 */
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  position: relative; /* Allows z-index to work */
  z-index: 2;
`;

const Row3 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ depth }) => depth}px;
  // outline: 1px solid black;
  box-shadow: 0px 4px 3px rgba(0, 0, 0, 0.3); /* Casts shadow over Tier 1 */
  display: flex;
  box-sizing: border-box; /* Ensures padding is part of the width */
  padding-left: ${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-right:${({ paddingLeftRight }) => paddingLeftRight}px;
  padding-top:${({ paddingTopBottom }) => paddingTopBottom}px;
  padding-bottom:${({ paddingTopBottom }) => paddingTopBottom}px;
  gap: ${({ holeGap }) => holeGap}px;
  border-radius: 10px;
  position: relative; /* Allows z-index to work */
  z-index: 3;
`;

const Hole = styled.div`
  background: darkgrey;
  width: ${({ diameter }) => diameter}px;
  height: ${({ diameter }) => diameter}px;
  outline: 1px solid black;
  box-shadow: inset 0 0 10px black; /* Inner shadow for depth */
  border-radius: ${({ shape }) => (shape === "circle" ? "50%" : "0")}; 
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ diameter }) => diameter * 0.4}px; /* Adjust text size dynamically */
  font-weight: bold;
  color: white;
`;

const ModelProfile = styled.div`

  margin-top: 70px;

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
  background: ${({ theme }) => theme.colors.black};

  border-sizing: border-box;
  border-left: 1px dashed black;
  border-right: 1px dashed black;
  border-bottom: 1px dashed black;

  position: absolute;
  z-index: 10;


  font-size: ${({ diameter }) => diameter * 0.4}px; /* Adjust text size dynamically */
  font-weight: bold;
  color: black;
  /* Number inside the hole */
  span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: ${({ hole_diameter }) => hole_diameter * 0.4}px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.headerSecondary};
    pointer-events: none; 
  }




  
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

const ThreeContainer = styled.div`
  width: min(100%, 400px);
  border-sizing: border-box;
  // outline: 1px solid black;
  aspect-ratio: 1 / 1; /* Ensures height always matches width */  
  background: ${({ theme }) => theme.colors.background}; 
  margin-top: 40px;


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
  
  h2 {
    color: ${({ theme }) => theme.colors.headerPrimary};
  }

  p {
    color: ${({ theme }) => theme.colors.headerSecondary};
  }

  span {
    color: ${({ theme }) => theme.colors.headerSecondary};
  }
  
  color: black;
  grid-area: right;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top:0px;

  /* LargeTablet (900-1250px) */
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
    flex-wrap: wrap;
    padding-left: 0px;
    padding-top: 0px;
  }

    /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    flex-wrap: wrap;
    padding-top: 0px;
  }

  
`;


const OrderDiv = styled.div`


  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 20px;


  h2, p {
    padding: 0;
    margin: 0;
  }
  
  h2 {
    color: ${({ theme }) => theme.colors.headerPrimary};

  }

  p {
    color: ${({ theme }) => theme.colors.headerSecondary};
    padding-bottom: 20px;
    font-size: 14px;
    line-height: 1;  
  }
  

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
      border-top: 4px solid ${({ theme }) => theme.colors.outline};
  }
  
`;


const AddToCartButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  width: auto; 
  min-width: 120px;
  background-color: #3474f1;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-block;
  width: 150px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.highlightSecondary};
  }

`;



const DownloadDiv = styled.div`
  
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  border-top: 4px solid ${({ theme }) => theme.colors.outline};
  border-bottom: 4px solid ${({ theme }) => theme.colors.outline};
  padding-bottom: 40px;
  padding-left: 20px;
  box-sizing: border-box;

  h2, p {
    padding: 0;
    margin: 0;
   }  

  p {
     line-height: 1;
     font-size: 14px;
     margin-bottom: 10px;

  }



  /* Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) {
      padding-left: 20px; 
      border-top: 0px solid ${({ theme }) => theme.colors.outline};
  }

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    padding-left: 20px; 
    border-top: 0px solid ${({ theme }) => theme.colors.outline};
  }
`;

const DownloadButton = styled.button`
  padding: 5px 10px; 
  margin-top: 10px;
  font-size: 14px; 
  width: auto; /* Shrinks to fit text */
  min-width: 120px; /* Ensures it doesn't get too small */
  background-color: ${({ theme }) => theme.colors.highlightPrimary};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  display: inline-block;
  width: 300px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.highlightSecondary};
  }
`;

const ComputedDiv = styled.div`
  box-sizing: border-box;
  padding-left: 20px;
  border-bottom: 4px solid ${({ theme }) => theme.colors.outline};
  padding-bottom: 20px;

  /* Large Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 20px; 
  }

`;

const AutodeskDiv = styled.div`
  box-sizing: border-box;

  padding-left: 20px;
  margin-bottom: 40px;

  /* Tablet 900-1250*/
  @media (min-width: ${breakpoints.largeTablet}) and (max-width: ${breakpoints.laptop}) {
      padding-left: 20px; 
      width: 100%;
      margin-bottom: 40px;
  }

`;

const ModelOutput = styled.div`
  flex-wrap: wrap;
  color: black;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  font-size: 12px;
  span:first-child {
    margin-right: 6px; 
    font-weight: bold; 
  }

  /* Mobile (<900) */
  @media (max-width: ${breakpoints.largeTablet}) {
    span:first-child {
      margin-right: 0px; 
      font-weight: bold; 
  }


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
  row_1_hole_diameter: 15,
  row_2_hole_diameter: 17,
  row_3_hole_diameter: 19,
  row_1_bottle_height: 120,
  row_2_bottle_height: 100,
  row_3_bottle_height: 80,

  row_1_hole_shape: "circle", // Options: "circle" or "square"
  row_2_hole_shape: "square",
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

const JscadViewer = ({ setExportScene, setStlURL, modelConfig}) => {
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

    

    //   // Clear previous canvas to prevent duplicates
    // while (mountRef.current.firstChild) {
    //   mountRef.current.removeChild(mountRef.current.firstChild);
    // }


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
      

      // // Initialize the JSCAD camera 
      // const perspectiveCamera = cameras.perspective;
      // const camera = Object.assign({}, perspectiveCamera.defaults);
      // perspectiveCamera.setProjection(camera, camera, { width: 400, height: 400 });
      // camera.position = [0, -400, 400]; 
      // camera.up = [0, 1, 0];  
      // camera.target = [0, 0, 0]; 
      // perspectiveCamera.update(camera, camera);
      // console.log("JSCAD Camera Position:", camera.position);
      // console.log("JSCAD Camera Target:", camera.target);

      // // Create complete options object
      // const options = {
      //   glOptions: { container: mountRef.current },
      //   camera,
      //   drawCommands: {
      //     drawMesh: drawCommands.drawMesh
      //   },
      //   entities: [
      //     // Add grid
      //     {
      //       visuals: {
      //         drawCmd: 'drawGrid',
      //         show: true
      //       },
      //       size: [200, 200],
      //       ticks: [25, 5]
      //     },
      //     // Add axis
      //     {
      //       visuals: {
      //         drawCmd: 'drawAxis',
      //         show: true
      //       },
      //       size: 150
      //     },
      //     // Add our geometry
      //     ...entitiesFromSolids({}, geometry)
      //   ]
      // };

      // // Create and call the renderer
      // const render = prepareRender(options);
      // render(options);

    } catch (error) {
      console.error('JSCAD Render Error:', error);
    }
  }, [setExportScene, modelConfig]);

  return <div ref={mountRef} />;
};


const ThreeViewer = ({ stlURL }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const modelRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !stlURL) return;

    // Initialize Three.js scene only once
    if (!sceneRef.current) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1c1c1c);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(65, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 2000);
      camera.position.set(0, 150, 150); // Move camera further back
      camera.lookAt(0, 0, 0);
      sceneRef.current.camera = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting
      // const light = new THREE.DirectionalLight(0xffffff, 1);
      // light.position.set(100, 200, 100);
      // light.castShadow = true;
      // scene.add(light);

      // // Ambient Light
      // const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
      // scene.add(ambientLight);

      // Improved lighting setup
      // Main directional light (like the sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increase intensity
      directionalLight.position.set(100, 200, 100);
      directionalLight.castShadow = true;
      // Improve shadow quality
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 10;
      directionalLight.shadow.camera.far = 500;
      directionalLight.shadow.bias = -0.001;
      scene.add(directionalLight);

      // Add a second directional light from opposite side
      const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
      backLight.position.set(-100, 100, -100);
      scene.add(backLight);

      // Increase ambient light intensity
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Increase brightness
      scene.add(ambientLight);


      // Orbit Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = true;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    }

    const scene = sceneRef.current;

    // Load new STL in the background while keeping the old model
    const loader = new STLLoader();
    loader.load(stlURL,(geometry) => {
        const material = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 });



        
        const newMesh = new THREE.Mesh(geometry, material);
        newMesh.rotation.x = -Math.PI / 2; // Rotate STL to match JSCAD/CAD coordinate system
      

        // Only replace the model once the new one is ready
        requestAnimationFrame(() => {
          if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current.geometry.dispose();
            modelRef.current.material.dispose();
          }
          modelRef.current = newMesh;
          scene.add(newMesh);
        });
      },
      undefined, // Progress callback (optional)
      (error) => {
        console.error("Error loading STL:", error);
      }
    );
  }, [stlURL]);

  return <ThreeContainer ref={mountRef} />;
};
const GridPreview = () => {

  const [userConfig, setUserConfig] = useAtom(baseModelConfigAtom);
  const [modelConfig] = useAtom(modelConfigAtom); // Auto-updated values
  const [exportScene, setExportScene] = useState(null); // Scene reference stored in state
  const [stlURL, setStlURL] = useState(null); // STL URL for Three.js
  const [openAccordions, setOpenAccordions] = useState({
    bottle1: true,
    bottle2: false,
    bottle3: false,
    holder: false 
  });

  const addToCart = async () => {
    try {
      const response = await fetch('https://shop.holderforge.com/cart/add.js', { // Use Shopify store domain
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensures the cart session is recognized
        body: JSON.stringify({
          id: "46443471143157", // Your actual variant ID
          quantity: 1,
          properties: {
            "Model Width": modelConfig.model_width,
            "Model Depth": modelConfig.model_depth,
            "Hole 1 Diameter": modelConfig.row_1_hole_diameter,
            "Hole 2 Diameter": modelConfig.row_2_hole_diameter,
            "Hole 3 Diameter": modelConfig.row_3_hole_diameter,
            "Hole 1 Shape": modelConfig.row_1_hole_shape,
            "Hole 2 Shape": modelConfig.row_2_hole_shape,
            "Hole 3 Shape": modelConfig.row_3_hole_shape,
          }
        })
      });
  
      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
  
      const data = await response.json();
      console.log("Added to cart:", data);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Add the function here, before any event handlers
  const computeRequiredModelDimensions = (newDiameter, prevConfig) => {
    const {
      row_1_hole_diameter,
      row_2_hole_diameter,
      row_3_hole_diameter,
      number_holes_per_row,
      edge_gap_scale_factor,
    } = prevConfig;
  
    // Find the largest hole diameter across all rows
    // When calling this for row_1, replace row_1_hole_diameter with newDiameter
    // (Same for row_2 and row_3)
    const maxHoleDiameter = Math.max(
      row_1_hole_diameter === newDiameter ? 0 : row_1_hole_diameter,
      row_2_hole_diameter === newDiameter ? 0 : row_2_hole_diameter,
      row_3_hole_diameter === newDiameter ? 0 : row_3_hole_diameter,
      newDiameter
    );
    
    const n = number_holes_per_row;
    const minInnerGap = 2.75;
    const minLeftRightPadding = minInnerGap * edge_gap_scale_factor;
  
    const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
    const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
  
    // Return the minimum required dimensions
    return {
      model_width: minModelWidth,
      model_depth: minModelDepth,
    };
  };

  const autoFitHolderDimensions = () => {
    // Get the largest hole diameter among all rows
    const maxHoleDiameter = Math.max(
      modelConfig.row_1_hole_diameter, 
      modelConfig.row_2_hole_diameter, 
      modelConfig.row_3_hole_diameter
    );
    
    // Calculate minimum dimensions directly
    const n = modelConfig.number_holes_per_row;
    const minInnerGap = 2.75;
    const minLeftRightPadding = minInnerGap * modelConfig.edge_gap_scale_factor;
    
    const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
    const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
    
    console.log("Autofit - Max Hole Diameter:", maxHoleDiameter);
    console.log("Autofit - Calculated Min Width:", minModelWidth);
    console.log("Autofit - Calculated Min Depth:", minModelDepth);
    
    // Directly update the state with calculated minimum values
    setUserConfig((prev) => ({
      ...prev,
      model_width: minModelWidth,
      model_depth: minModelDepth,
    }));
  };
  
  
  useEffect(() => {
    setUserConfig((prev) => {
      // Recompute values that depend on model_width
      const { model_width, model_depth } = computeRequiredModelDimensions(prev.row_1_hole_diameter, prev);
  
      return {
        ...prev,
        model_width,
        model_depth,
      };
    });
  }, []); // Runs whenever model_width updates


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
    const newWidth = parseInt(e.target.value, 10) || 0;
    
    setUserConfig((prev) => {
      // Calculate the minimum width directly here
      const maxHoleDiameter = Math.max(
        prev.row_1_hole_diameter, 
        prev.row_2_hole_diameter, 
        prev.row_3_hole_diameter
      );
      
      const n = prev.number_holes_per_row;
      const minInnerGap = 2.75;
      const minLeftRightPadding = minInnerGap * prev.edge_gap_scale_factor;
      
      const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
      
      // Ensure width is at least the minimum required value
      return {
        ...prev,
        model_width: Math.max(newWidth, minModelWidth),
      };
    });
  };

  const updateModelDepth = (e) => {
    const newDepth = parseInt(e.target.value, 10) || 0;
    
    setUserConfig((prev) => {
      // Calculate the minimum depth directly here
      const maxHoleDiameter = Math.max(
        prev.row_1_hole_diameter, 
        prev.row_2_hole_diameter, 
        prev.row_3_hole_diameter
      );
      
      const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
      
      // Ensure depth is at least the minimum required value
      return {
        ...prev,
        model_depth: Math.max(newDepth, minModelDepth),
      };
    });
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
    const newDiameter = parseInt(e.target.value) || 0;
    
    setUserConfig((prev) => {
      // Calculate the new maximums directly with the current state + new diameter
      const maxHoleDiameter = Math.max(
        newDiameter,  // Use the new diameter value directly
        prev.row_2_hole_diameter,
        prev.row_3_hole_diameter
      );
      
      const n = prev.number_holes_per_row;
      const minInnerGap = 2.75;
      const minLeftRightPadding = minInnerGap * prev.edge_gap_scale_factor;
      
      // Calculate the new minimum dimensions
      const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
      const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
      
      // Calculate new gaps based on the new width
      const newInnerGap = (minModelWidth - (n * newDiameter)) / (n - 1);
      const newPadding = prev.edge_gap_scale_factor * newInnerGap;
      
      return {
        ...prev,
        row_1_hole_diameter: newDiameter,
        model_width: minModelWidth,  // Always use the minimum width
        model_depth: minModelDepth,  // Always use the minimum depth
        row_1_inner_gap: newInnerGap,
        row_1_padding_left_right: newPadding,
      };
    });
  };

  const updateRow2HoleDiameter = (e) => {
    const newDiameter = parseInt(e.target.value) || 0;
    
    setUserConfig((prev) => {
      // Calculate the new maximums directly with the current state + new diameter
      const maxHoleDiameter = Math.max(
        prev.row_1_hole_diameter,
        newDiameter,  // Use the new diameter value directly
        prev.row_3_hole_diameter
      );
      
      const n = prev.number_holes_per_row;
      const minInnerGap = 2.75;
      const minLeftRightPadding = minInnerGap * prev.edge_gap_scale_factor;
      
      // Calculate the new minimum dimensions
      const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
      const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
      
      // Calculate new gaps based on the new width
      const newInnerGap = (minModelWidth - (n * newDiameter)) / (n - 1);
      const newPadding = prev.edge_gap_scale_factor * newInnerGap;
      
      return {
        ...prev,
        row_2_hole_diameter: newDiameter,
        model_width: minModelWidth,  // Always use the minimum width
        model_depth: minModelDepth,  // Always use the minimum depth
        row_2_inner_gap: newInnerGap,
        row_2_padding_left_right: newPadding,
      };
    });
  };

  const updateRow3HoleDiameter = (e) => {
    const newDiameter = parseInt(e.target.value) || 0;
    
    setUserConfig((prev) => {
      // Calculate the new maximums directly with the current state + new diameter
      const maxHoleDiameter = Math.max(
        prev.row_1_hole_diameter,
        prev.row_2_hole_diameter,
        newDiameter  // Use the new diameter value directly
      );
      
      const n = prev.number_holes_per_row;
      const minInnerGap = 2.75;
      const minLeftRightPadding = minInnerGap * prev.edge_gap_scale_factor;
      
      // Calculate the new minimum dimensions
      const minModelWidth = Math.ceil((minInnerGap * (n - 1)) + (2 * minLeftRightPadding) + (n * maxHoleDiameter));
      const minModelDepth = Math.ceil(3 * (8 + maxHoleDiameter));
      
      // Calculate new gaps based on the new width
      const newInnerGap = (minModelWidth - (n * newDiameter)) / (n - 1);
      const newPadding = prev.edge_gap_scale_factor * newInnerGap;
      
      return {
        ...prev,
        row_3_hole_diameter: newDiameter,
        model_width: minModelWidth,  // Always use the minimum width
        model_depth: minModelDepth,  // Always use the minimum depth
        row_3_inner_gap: newInnerGap,
        row_3_padding_left_right: newPadding,
      };
    });
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
    <>
      <Helmet>
        <style>
          {`
            * {
              -webkit-tap-highlight-color: transparent;
            }
          `}
        </style>
        <title>HolderForge</title>
        <meta name="description" content="HolderForge lets you design and customize holders and organizers for cologne, perfume, makeup, lipstick, concealers, bottles and more. Custom fit organization. Perfect for travel, home organization, and keeping your fragrance and cosmetics collection secure and organized. " />
        <meta name="keywords" content="custom holder, custom organizer, 3D printed model generator for bottle holders, custom cologne holders, custom perfume holders, custom bottle holders, makeup organizers, travel cologne holders, lipstick organizer" />
        <meta name="robots" content="index, follow" />
      </Helmet>
    <GridLayout>
      <Header>
        <h1>HolderForge</h1>
        <h2>Make a Custom Organizer</h2>
      </Header>
      <LeftPanel>
        <BottleInputContainer>
          <h2>Things To Hold</h2>
          <AccordionContainer>
            <AccordionItem>
              <AccordionHeader onClick={() => setOpenAccordions(prev => ({
                ...prev,
                bottle1: !prev.bottle1
              }))}>
                <h3>Thing 1</h3>
                {!openAccordions.bottle1 && (
                  <AccordionSummary>
                    {`${modelConfig.row_1_hole_diameter}mm × ${modelConfig.row_1_bottle_height}mm`}
                    <ShapeSummaryIcon shape={modelConfig.row_1_hole_shape} />
                  </AccordionSummary>
                )}
                {openAccordions.bottle1 ? '▲' : '▼'}
            </AccordionHeader>
            <AccordionContent isOpen={openAccordions.bottle1}>
            <AccordionItemLeft>
            <ModelInput>
              <InputSpan>
                Diameter
                <NumberInput 
                  value={modelConfig.row_1_hole_diameter} 
                  onChange={updateRow1HoleDiameter} 
                  min={10} 
                  max={30}
                  step={1}
                />
              </InputSpan>
              <InputRange type="range" min={10} max={30} value={modelConfig.row_1_hole_diameter} onChange={updateRow1HoleDiameter} />
            </ModelInput>
            <ModelInput>
              <InputSpan>
                Height  
                <NumberInput 
                  value={modelConfig.row_1_bottle_height} 
                  onChange={updateRow1BottleHeight} 
                  min={40} 
                  max={135}
                  step={1}
                />
              </InputSpan>
              <InputRange type="range" min={40} max={135} value={modelConfig.row_1_bottle_height} onChange={updateRow1BottleHeight} />
            </ModelInput>
              <ModelInput>
                <InputSpan>
                <span>Shape</span>
                </InputSpan>
                <InputShape modelConfig={modelConfig} onChange={updateRow1HoleShape} rowIndex={1} />
              </ModelInput>
                <InputSpan>
                  <span> Quantity: 5</span>
                </InputSpan>
              </AccordionItemLeft>
              <AccordionItemRight>
                <BottlePreview modelConfig={modelConfig} rowIndex={1} />
              </AccordionItemRight>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem>
              <AccordionHeader onClick={() => setOpenAccordions(prev => ({
                  ...prev,
                  bottle2: !prev.bottle2
                }))}>
                  <h3>Thing 2</h3>
                  {!openAccordions.bottle2 && (
                    <AccordionSummary>
                      {`${modelConfig.row_2_hole_diameter}mm × ${modelConfig.row_2_bottle_height}mm`}
                      <ShapeSummaryIcon shape={modelConfig.row_2_hole_shape} />
                    </AccordionSummary>
                  )}
                  {openAccordions.bottle2 ? '▲' : '▼'}
              </AccordionHeader>
              <AccordionContent isOpen={openAccordions.bottle2}>
                <AccordionItemLeft>
                <ModelInput>
                  <InputSpan>
                    Diameter
                    <NumberInput 
                      value={modelConfig.row_2_hole_diameter} 
                      onChange={updateRow2HoleDiameter} 
                      min={10} 
                      max={30}
                      step={1}
                    />
                  </InputSpan>
                  <InputRange type="range" min={10} max={30} value={modelConfig.row_2_hole_diameter} onChange={updateRow2HoleDiameter} />
                </ModelInput>
                <ModelInput>
                  <InputSpan>
                    Height  
                    <NumberInput 
                      value={modelConfig.row_2_bottle_height} 
                      onChange={updateRow2BottleHeight} 
                      min={40} 
                      max={135}
                      step={1}
                    />
                  </InputSpan>
                  <InputRange type="range" min={40} max={135} value={modelConfig.row_2_bottle_height} onChange={updateRow2BottleHeight} />
                </ModelInput>
                  <ModelInput>
                    <InputSpan>
                    <span>Shape</span>
                    </InputSpan>
                    <InputShape modelConfig={modelConfig} onChange={updateRow2HoleShape} rowIndex={2} />
                  </ModelInput>
                  <InputSpan>
                      <span> Quantity: 5</span>
                    </InputSpan>
                </AccordionItemLeft>  
                <AccordionItemRight>
                <BottlePreview modelConfig={modelConfig} rowIndex={2} />
                </AccordionItemRight>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem>
            <AccordionHeader onClick={() => setOpenAccordions(prev => ({
                ...prev,
                bottle3: !prev.bottle3
              }))}>
                <h3>Thing 3</h3>
                {!openAccordions.bottle3 && (
                  <AccordionSummary>
                    {`${modelConfig.row_3_hole_diameter}mm × ${modelConfig.row_3_bottle_height}mm`}
                    <ShapeSummaryIcon shape={modelConfig.row_3_hole_shape} />
                  </AccordionSummary>
                )}
                {openAccordions.bottle3 ? '▲' : '▼'}
            </AccordionHeader>
            <AccordionContent isOpen={openAccordions.bottle3}>
              <AccordionItemLeft>
              <ModelInput>
                <InputSpan>
                  Diameter
                  <NumberInput 
                    value={modelConfig.row_3_hole_diameter} 
                    onChange={updateRow3HoleDiameter} 
                    min={10} 
                    max={30}
                    step={1}
                  />
                </InputSpan>
                <InputRange type="range" min={10} max={30} value={modelConfig.row_3_hole_diameter} onChange={updateRow3HoleDiameter} />
              </ModelInput>
              <ModelInput>
                <InputSpan>
                  Height  
                  <NumberInput 
                    value={modelConfig.row_3_bottle_height} 
                    onChange={updateRow3BottleHeight} 
                    min={40} 
                    max={135}
                    step={1}
                  />
                </InputSpan>
                <InputRange type="range" min={40} max={135} value={modelConfig.row_3_bottle_height} onChange={updateRow3BottleHeight} />
              </ModelInput>
              <ModelInput>
                <InputSpan>
                <span>Shape</span>
                </InputSpan>
                <InputShape modelConfig={modelConfig} onChange={updateRow3HoleShape} rowIndex={3} />
              </ModelInput>
                <InputSpan>
                  <span> Quantity: 5</span>
                </InputSpan>
              </AccordionItemLeft>
              <AccordionItemRight>
                <BottlePreview modelConfig={modelConfig} rowIndex={3} />
              </AccordionItemRight>
            </AccordionContent>
            </AccordionItem>
          </AccordionContainer>
        </BottleInputContainer>


        <HolderModelInputContainer>     
          <h2>Holder</h2>
          <AccordionHolderContainer>
            <AccordionHolderItem>
              <AccordionHolderHeader onClick={() => setOpenAccordions(prev => ({
                ...prev,
                holder: !prev.holder
              }))}>
                <h3>Dimensions</h3>
                {!openAccordions.holder && (
                  <AccordionHolderSummary>
                    {`${modelConfig.model_width}mm × ${modelConfig.model_depth}mm`}
                    <HolderSummaryIcon width={modelConfig.model_width} height={modelConfig.model_height} />
                  </AccordionHolderSummary>
                )}
                {openAccordions.holder ? '▲' : '▼'}
              </AccordionHolderHeader>
              <AccordionHolderContent isOpen={openAccordions.holder}>
                <AccordionHolderItemLeft>
                  <ModelInput>
                    <InputSpan>
                      Width  
                      <NumberInput 
                        value={modelConfig.model_width} 
                        onChange={updateModelWidth} 
                        min={10} 
                        max={200} 
                      />
                    </InputSpan>
                  </ModelInput>
                  <ModelInput>
                    <InputSpan>
                      Depth  
                      <NumberInput 
                        value={modelConfig.model_depth} 
                        onChange={updateModelDepth} 
                        min={10} 
                        max={200}
                      />
                    </InputSpan>
                  </ModelInput>
                  <AutofitButton onClick={autoFitHolderDimensions}>
                    Autofit
                  </AutofitButton>
                </AccordionHolderItemLeft>
              </AccordionHolderContent>
            </AccordionHolderItem>
          </AccordionHolderContainer>
        </HolderModelInputContainer>

      </LeftPanel>
      <CenterPanel>
        <h2>Preview</h2>
        <ModelContainer>
          <ModelWrapper>
            <Model
              model_width={modelConfig.model_width * modelConfig.mm2pixel}
              model_depth={modelConfig.model_depth * modelConfig.mm2pixel}
          >
            <Row3 depth={modelConfig.row_3_depth * modelConfig.mm2pixel} 
                  paddingLeftRight={modelConfig.row_3_padding_left_right * modelConfig.mm2pixel}
                  paddingTopBottom={modelConfig.row_3_padding_top_bottom * modelConfig.mm2pixel}
                  holeGap={modelConfig.row_3_inner_gap * modelConfig.mm2pixel}
            >
              <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}>3</Hole>
              <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}>3</Hole>
              <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}>3</Hole>
              <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}>3</Hole>
              <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_3_hole_shape}>3</Hole>
            </Row3>
            <Row2 depth={modelConfig.row_2_depth * modelConfig.mm2pixel}
                  paddingLeftRight={modelConfig.row_2_padding_left_right * modelConfig.mm2pixel}
                  paddingTopBottom={modelConfig.row_2_padding_top_bottom * modelConfig.mm2pixel}
                  holeGap={modelConfig.row_2_inner_gap * modelConfig.mm2pixel}
            >
              <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}>2</Hole>
              <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}>2</Hole>
              <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}>2</Hole>
              <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}>2</Hole>
              <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_2_hole_shape}>2</Hole>
            </Row2>
            <Row1 depth={modelConfig.row_1_depth * modelConfig.mm2pixel} 
                  paddingLeftRight={modelConfig.row_1_padding_left_right * modelConfig.mm2pixel}
                  paddingTopBottom={modelConfig.row_1_padding_top_bottom * modelConfig.mm2pixel}
                  holeGap={modelConfig.row_1_inner_gap * modelConfig.mm2pixel}
            >
              <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape}>1</Hole>
              <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape}>1</Hole>
              <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape}>1</Hole>
              <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape}>1</Hole>
              <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} shape={modelConfig.row_1_hole_shape}>1</Hole>
            </Row1>  
            </Model>
          </ModelWrapper>
        </ModelContainer>
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
            >
              <span>3</span>
            </ModelProfileHole>
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
            >
              <span>2</span>
            </ModelProfileHole>
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
            >
              <span>1</span>
            </ModelProfileHole>
          </ModelProfileTier>  
        </ModelProfile>
        <JscadViewer setExportScene={setExportScene} setStlURL={setStlURL} modelConfig={modelConfig} />
        <ThreeViewer stlURL={stlURL} />
      </CenterPanel>
      <RightPanel>
        <OrderDiv>
          <h2>Order</h2>
          <p>Printed and shipped to you</p>
          <AddToCartButton onClick={addToCart}>
            Add to Cart
          </AddToCartButton>
        </OrderDiv>
        <DownloadDiv>
          <h2>Download</h2>
          <p>Print with a 3D printer</p>
          <DownloadButton onClick={downloadSTLFile}>Download STL File</DownloadButton>
          <DownloadButton onClick={generatePythonFile}>Download Autodesk Fusion Python File</DownloadButton>
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
    </>
  );
};

export default GridPreview;