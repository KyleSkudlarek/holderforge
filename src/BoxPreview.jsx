import React, { useState } from "react";
import { atom, useAtom } from "jotai";
import styled from "styled-components";

// Jotai state for grid (explicit row hole sizes)
const boxConfigAtom = atom({
  row1HoleSize: 35, // Bottom row
  row2HoleSize: 20, // Middle row
  row3HoleSize: 24, // Top row
  holeSpacing: 3, // 3mm between holes
  rows: 3, // Fixed number of rows
  columns: 5, // Number of columns
  mm2pixel: 2, // Scale factor (1mm = 2px)
  rowTierHeight: 8, // Height difference per tier in mm
  minGap: 4, // Minimum gap between holes in mm
});

// Styled Components
const Container = styled.div.attrs({ displayName: "Container" })`
  display: flex;
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
  width: 100%;
`;

const BoxWrapper = styled.div.attrs({ displayName: "BoxWrapper" })`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.15), /* Outer shadow */
    inset 0 4px 6px rgba(0, 0, 0, 0.1); /* Inner shadow */
  border-radius: 15px;
`;

const Box = styled.div.attrs({ displayName: "Box" })`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 10px;
`;

const Row = styled.div.attrs({ displayName: "Row" })`
  display: grid;
  grid-template-columns: ${({ columns }) => `repeat(${columns}, 1fr)`};
  place-items: center;
  position: relative;
  width: 100%;
`;

const Hole = styled.div.attrs({ displayName: "Hole" })`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background: radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8));
  border-radius: 50%;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.5);
  align-self: center;
  justify-self: center;
  margin: ${({ minGap }) => minGap / 2}px;
`;

const ControlsWrapper = styled.div.attrs({ displayName: "ControlsWrapper" })`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  background-color: #f4f4f4;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
  width: auto; /* Ensures it resizes based on input size */
`;

const RowControls = styled.div.attrs({ displayName: "RowControls" })`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  color: black;
  font-weight: bold;
  white-space: nowrap; /* Ensures text stays in one line */
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
  const [row1Size, setRow1Size] = useState(boxConfig.row1HoleSize);
  const [row2Size, setRow2Size] = useState(boxConfig.row2HoleSize);
  const [row3Size, setRow3Size] = useState(boxConfig.row3HoleSize);

  // Calculate box size dynamically based on the largest hole size in any row
  const maxRowHoleSize = Math.max(row1Size, row2Size, row3Size);
  const boxWidth =
    boxConfig.columns * (maxRowHoleSize + boxConfig.holeSpacing) * boxConfig.mm2pixel;
  const boxHeight =
    boxConfig.rows * (maxRowHoleSize + boxConfig.holeSpacing) * boxConfig.mm2pixel +
    boxConfig.rowTierHeight * boxConfig.rows * boxConfig.mm2pixel;

  // Apply the updated hole sizes when the "Calculate" button is clicked
  const applyHoleSizes = () => {
    setBoxConfig((prev) => ({
      ...prev,
      row1HoleSize: row1Size,
      row2HoleSize: row2Size,
      row3HoleSize: row3Size,
    }));
  };

  return (
    <Container>
      <ContentWrapper>
        {/* Row inputs positioned to the left with a dynamic width */}
        <ControlsWrapper>
          <RowControls>
            <span>Row 3 Hole Size</span>
            <Input
              type="number"
              value={row3Size}
              onChange={(e) => setRow3Size(parseInt(e.target.value) || 0)}
            />
          </RowControls>
          <RowControls>
            <span>Row 2 Hole Size</span>
            <Input
              type="number"
              value={row2Size}
              onChange={(e) => setRow2Size(parseInt(e.target.value) || 0)}
            />
          </RowControls>
          <RowControls>
            <span>Row 1 Hole Size</span>
            <Input
              type="number"
              value={row1Size}
              onChange={(e) => setRow1Size(parseInt(e.target.value) || 0)}
            />
          </RowControls>
        </ControlsWrapper>

        {/* BoxWrapper now tightly fits around Box */}
        <BoxWrapper>
          <Box>
            {[row3Size, row2Size, row1Size].map((size, rowIndex) => (
              <Row key={rowIndex} columns={boxConfig.columns}>
                {Array.from({ length: boxConfig.columns }).map((_, colIndex) => (
                  <Hole
                    key={`${rowIndex}-${colIndex}`}
                    size={size * boxConfig.mm2pixel}
                    minGap={boxConfig.minGap}
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