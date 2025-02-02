import React from "react";
import styled from "styled-components";
import { atom, useAtom } from "jotai";

const modelConfigAtom = atom({
  mm2pixel: 2, // Scale factor (1mm = 2px)
  width: 120, // Default model width in mm
  height: 81, // Default model width in mm
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
  border-bottom: 3px solid black;
`;

const Footer = styled.footer`
  grid-area: footer;
  background: grey;
  border-top: 3px solid black;
`;

const LeftPanel = styled.div`
  grid-area: left;
  background: white;
  border: 3px solid black;
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
  border: 3px solid black;
`;

const CenterPanel = styled.div`
  grid-area: center;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Model = styled.div`
  background: lightgray;
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


  return (
    <GridLayout>
      <Header />
      <LeftPanel>
        <ModelInput>
          <span>Model Width (mm)</span>
          <Input type="number" value={modelConfig.width} onChange={updateModelWidth} />
        </ModelInput>
        <ModelInput>
          <span>Model Height (mm)</span>
          <Input type="number" value={modelConfig.height} onChange={updateModelHeight} />
        </ModelInput>
      </LeftPanel>
      <CenterPanel>
        <Model
          style={{
            width: modelConfig.width * modelConfig.mm2pixel,
            height: modelConfig.height * modelConfig.mm2pixel,
          }}
        />
      </CenterPanel>
      <RightPanel />
      <Footer />
    </GridLayout>
  );
};

export default GridPreview;