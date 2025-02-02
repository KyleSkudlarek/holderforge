import React from "react";
import styled from "styled-components";
import { atom, useAtom } from "jotai";

const modelConfigAtom = atom({
  mm2pixel: 2, // Scale factor (1mm = 2px). Default is 2
  width: 120, // Default model width in mm. Default is 120
  height: 81, // Default model width in mm. Default is 81
  rows: 3, // Default is 3
  row_1_height: 27, // Default is 27
  row_2_height: 27, // Default is 27
  row_3_height: 27, // Default is 27
  row_1_hole_diameter: 15, // Default is 15
  row_2_hole_diameter: 15, // Default is 15
  row_3_hole_diameter: 15, // Default is 15
});

// Styled Components
const GridLayout = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  grid-template-columns: 1fr 1fr 1fr;
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
  grid-area: right;
  background: white;
  outline: 3px solid black;
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
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  outline: 1px solid black;
`;

const Row1 = styled.div`
  background: lightgrey;
  width: 100%;
  height: ${({ height }) => height}px;
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
  height: ${({ height }) => height}px;
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
  height: ${({ height }) => height}px;
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



const GridPreview = () => {
  const [modelConfig, setModelConfig] = useAtom(modelConfigAtom);

  const updateModelWidth = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      width: parseInt(e.target.value) || 0, // Ensure it's a number
    }));
  };

  const updateModelHeight = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow1Height = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      row_1_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow2Height = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      row_2_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow3Height = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      row_3_height: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow1HoleDiameter = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      row_1_hole_diameter: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow2HoleDiameter = (e) => {
    setModelConfig((prev) => ({
      ...prev,
      row_2_hole_diameter: parseInt(e.target.value) || 0,
    }));
  };

  const updateRow3HoleDiameter = (e) => {
    setModelConfig((prev) => ({
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
          <Input type="number" value={modelConfig.width} onChange={updateModelWidth} />
        </ModelInput>
        <ModelInput>
          <span>Model Height (mm)</span>
          <Input type="number" value={modelConfig.height} onChange={updateModelHeight} />
        </ModelInput>
        <ModelInput>
          <span>Row 1 Height (mm)</span>
          <Input type="number" value={modelConfig.row_1_height} onChange={updateRow1Height} />
        </ModelInput>
        <ModelInput>
          <span>Row 2 Height (mm)</span>
          <Input type="number" value={modelConfig.row_2_height} onChange={updateRow2Height} />
        </ModelInput>
        <ModelInput>
          <span>Row 3 Height (mm)</span>
          <Input type="number" value={modelConfig.row_3_height} onChange={updateRow3Height} />
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
            width={modelConfig.width * modelConfig.mm2pixel}
            height={modelConfig.height * modelConfig.mm2pixel}
        >
          <Row1 height={modelConfig.row_1_height * modelConfig.mm2pixel} 
                paddingLeftRight={9.9 * modelConfig.mm2pixel}
                paddingTopBottom={6 * modelConfig.mm2pixel}
                holeGap={6.3 * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_1_hole_diameter * modelConfig.mm2pixel} />
          </Row1>
          <Row2 height={modelConfig.row_2_height * modelConfig.mm2pixel}
                paddingLeftRight={9.9 * modelConfig.mm2pixel}
                paddingTopBottom={6 * modelConfig.mm2pixel}
                holeGap={6.3 * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_2_hole_diameter * modelConfig.mm2pixel} />
          </Row2>  
          <Row3 height={modelConfig.row_3_height * modelConfig.mm2pixel} 
                paddingLeftRight={9.9 * modelConfig.mm2pixel}
                paddingTopBottom={6 * modelConfig.mm2pixel}
                holeGap={6.3 * modelConfig.mm2pixel}
          >
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
            <Hole diameter={modelConfig.row_3_hole_diameter * modelConfig.mm2pixel} />
          </Row3>
        </Model>
      </CenterPanel>
      <RightPanel />
      <Footer />
    </GridLayout>
  );
};

export default GridPreview;