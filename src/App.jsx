import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, SoftShadows } from "@react-three/drei";
import React, { useState } from "react";

function App() {
  const [inputDiameter, setInputDiameter] = useState("20");
  const [renderedDiameter, setRenderedDiameter] = useState(20);
  const FIXED_HEIGHT = 25;

  const limits = {
    diameter: { min: 10, max: 30 }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    // If change is from spinbutton (step of 1)
    if (Math.abs(Number(newValue) - Number(inputDiameter)) === 1) {
      updateRenderedDiameter(newValue);
    } else {
      // Just update input state while typing
      setInputDiameter(newValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      updateRenderedDiameter(e.target.value);
    }
  };

  const updateRenderedDiameter = (value) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, limits.diameter.min), limits.diameter.max);
      setInputDiameter(String(clampedValue));
      setRenderedDiameter(clampedValue);
    } else {
      setInputDiameter(String(limits.diameter.min));
      setRenderedDiameter(limits.diameter.min);
    }
  };

  const handleBlur = (e) => {
    updateRenderedDiameter(e.target.value);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", gap: "40px", marginLeft: "20px" }}>
      
      {/* Input Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "200px" }}>
        <label>
          Diameter (mm): 
          <input
            type="number"
            value={inputDiameter}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            min={limits.diameter.min}
            max={limits.diameter.max}
            step="1"
            style={{ width: "50px" }}
          />
        </label>
      </div>

      {/* 3D Preview Section */}
      <div style={{ width: "500px", height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Canvas shadows camera={{ position: [-2, 3, 2], fov: 45 }}>
          <SoftShadows />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[2, 5, 2]}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            intensity={0.8}
          />
          
          {/* Floor Grid */}
          <Grid args={[10, 10]} cellSize={0.2} cellColor="#aaaaaa" sectionColor="#ffffff" fadeDistance={10} />

          {/* Cube */}
          <mesh position={[0, FIXED_HEIGHT / 200, 0]} scale={[renderedDiameter / 100, FIXED_HEIGHT / 100, renderedDiameter / 100]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="white" />
          </mesh>

          {/* Orbit Controls for panning & zooming */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={true}
            maxDistance={10}
            minDistance={2}
          />
        </Canvas>
      </div>

    </div>
  );
}

export default App;