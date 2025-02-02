import React, { useState } from "react";
import { atom, useAtom } from "jotai";
import styled from "styled-components";

// Jotai state for grid (controls box size & hole settings per row)
const boxConfigAtom = atom({
  holeSizes: [24, 20, 30], // Now correctly ordered: Row 3 (bottom) controls the bottom row
  holeSpacing: 3, // Set to 3mm
  rows: 3, // Number of rows
  columns: 5, // Number of columns
  mm2pixel: 2, // Scale factor (1mm = 2px)
  rowTierHeight: 8, // Height difference per tier in mm
});

// Styled Components
const Container = styled.div.attrs({ displayName: "Container" })`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #e5e7eb;
`;

const ContentWrapper = styled.div.attrs({ displayName: "ContentWrapper" })`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 30px;
`;

const BoxWrapper = styled.div.attrs({ displayName: "BoxWrapper" })`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Box = styled.div.attrs({ displayName: "Box" })`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Ensure holes are centered */
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2), 6px 6px 10px rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  padding: 10px;
`;

const Row = styled.div.attrs({ displayName: "Row" })`
  display: grid;
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  place-items: center;
  position: relative;
  width: 100%;
  padding: 8px 0;
`;

const Hole = styled.div.attrs({ displayName: "Hole" })`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background: radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8));
  border-radius: 50%;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.5);
  align-self: center;
  justify-self: center;
`;

const ControlsWrapper = styled.div.attrs({ displayName: "ControlsWrapper" })`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: ${({ height }) => height}px; /* Dynamically match BoxWrapper height */
`;

const RowControls = styled.div.attrs({ displayName: "RowControls" })`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Input = styled.input.attrs({ displayName: "Input" })`
  padding: 5px;
  font-size: 16px;
  width: 60px;
  text-align: center;
  background: #222;
  color: white;
  border: none;
  border-radius: 5px;
`;

const CalculateWrapper = styled.div.attrs({ displayName: "CalculateWrapper" })`
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 20px;
  width: 100%;
`;

const Button = styled.button.attrs({ displayName: "Button" })`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 16px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
`;

const BoxPreview = () => {
  const [boxConfig, setBoxConfig] = useAtom(boxConfigAtom);
  const [newHoleSizes, setNewHoleSizes] = useState([...boxConfig.holeSizes]);

  // Calculate box size dynamically based on the largest hole size in any row
  const maxRowHoleSize = Math.max(...boxConfig.holeSizes);
  const boxWidth =
    boxConfig.columns * (maxRowHoleSize + boxConfig.holeSpacing) * boxConfig.mm2pixel;
  const boxHeight =
    boxConfig.rows * (maxRowHoleSize + boxConfig.holeSpacing) * boxConfig.mm2pixel +
    boxConfig.rowTierHeight * boxConfig.rows * boxConfig.mm2pixel;

  // Handle hole size input change per row
  const handleInputChange = (rowIndex, e) => {
    const updatedSizes = [...newHoleSizes];
    updatedSizes[rowIndex] = parseInt(e.target.value) || 0;
    setNewHoleSizes(updatedSizes);
  };

  // Apply the updated hole sizes when the "Calculate" button is clicked
  const applyHoleSizes = () => {
    setBoxConfig((prev) => ({
      ...prev,
      holeSizes: [...newHoleSizes], // Preserve row order to avoid flipping on re-render
    }));
  };

  return (
    <Container>
      <ContentWrapper>
        {/* Row inputs positioned to match row alignment */}
        <ControlsWrapper height={boxHeight}>
          {boxConfig.holeSizes
            .slice()
            .reverse() // Ensures Row 1 (bottom input) now controls the bottom row of circles
            .map((size, index) => (
              <RowControls key={index}>
                <span>Row {index + 1}</span>
                <Input
                  type="number"
                  value={newHoleSizes[boxConfig.rows - 1 - index]} // Match correct row
                  onChange={(e) => handleInputChange(boxConfig.rows - 1 - index, e)}
                />
              </RowControls>
            ))}
        </ControlsWrapper>

        {/* Box with dynamically updated size */}
        <BoxWrapper>
          <Box width={boxWidth} height={boxHeight}>
            {boxConfig.holeSizes.map((size, rowIndex) => (
              <Row key={rowIndex} columns={boxConfig.columns}>
                {Array.from({ length: boxConfig.columns }).map((_, colIndex) => (
                  <Hole
                    key={`${rowIndex}-${colIndex}`}
                    size={boxConfig.holeSizes[rowIndex] * boxConfig.mm2pixel}
                  />
                ))}
              </Row>
            ))}
          </Box>
        </BoxWrapper>
      </ContentWrapper>

      {/* Centered Calculate Button */}
      <CalculateWrapper>
        <Button onClick={applyHoleSizes}>Calculate</Button>
      </CalculateWrapper>
    </Container>
  );
};

export default BoxPreview;