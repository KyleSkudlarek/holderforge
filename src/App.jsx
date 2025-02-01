import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, SoftShadows } from "@react-three/drei";
import React, { useState } from "react";

function App() {
  // State for cube dimensions
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(50); // Fixed at 50mm
  const [depth, setDepth] = useState(100);

  // Function to clamp values but allow empty input temporarily
  const handleInputChange = (setter, min, max) => (e) => {
    const value = e.target.value;
    if (value === "") {
      setter(""); // Allow temporary empty input
    } else {
      setter(Math.min(Math.max(Number(value), min), max));
    }
  };

  // Function to enforce limits when user leaves the input field
  const handleBlur = (setter, min, max, defaultValue) => (e) => {
    const value = e.target.value;
    if (value === "") {
      setter(defaultValue); // Restore default if left empty
    } else {
      setter(Math.min(Math.max(Number(value), min), max));
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", gap: "40px" }}>
      
      {/* Input Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "200px" }}>
        <label>
          Width (mm): 
          <input
            type="number"
            value={width}
            onChange={handleInputChange(setWidth, 50, 200)}
            onBlur={handleBlur(setWidth, 50, 200, 100)}
            min="50"
            max="200"
          />
        </label>
        <label>
          Height (Fixed at 50mm):
          <input
            type="number"
            value={height}
            disabled // Prevent user from changing height
          />
        </label>
        <label>
          Depth (mm): 
          <input
            type="number"
            value={depth}
            onChange={handleInputChange(setDepth, 50, 200)}
            onBlur={handleBlur(setDepth, 50, 200, 100)}
            min="50"
            max="200"
          />
        </label>
      </div>

      {/* 3D Preview Section */}
      <div style={{ width: "500px", height: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Canvas shadows camera={{ position: [2, 2, 4], fov: 50 }}>
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
          <mesh position={[0, height / 200, 0]} scale={[width / 100, height / 100, depth / 100]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="blue" />
          </mesh>

          {/* Orbit Controls for panning & zooming */}
          <OrbitControls enableZoom={true} enablePan={true} />
        </Canvas>
      </div>

    </div>
  );
}

export default App;