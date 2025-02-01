import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, SoftShadows } from "@react-three/drei";
import React, { useState, useMemo } from "react";
import { SUBTRACTION, Brush, Evaluator } from "three-bvh-csg";
import * as THREE from "three";

function BoxWithHole({ diameter }) {
  const FIXED_HEIGHT = 25;

  // Create the CSG geometry
  const geometry = useMemo(() => {
    const evaluator = new Evaluator();

    // Base box
    const box = new Brush(new THREE.BoxGeometry(1, 1, 1));

    // Cylinder hole
    const hole = new Brush(new THREE.CylinderGeometry(diameter / 200, diameter / 200, 1.2, 32));
    hole.position.set(0, 0, 0);
    hole.rotation.x = Math.PI / 2; // Rotate to align with box

    // Subtract the hole from the box
    const result = evaluator.evaluate(box, hole, SUBTRACTION);
    
    return result.geometry;
  }, [diameter]);

  return (
    <mesh position={[0, FIXED_HEIGHT / 200, 0]} scale={[1, FIXED_HEIGHT / 100, 1]} castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function App() {
  const [inputDiameter, setInputDiameter] = useState("20");
  const [renderedDiameter, setRenderedDiameter] = useState(20);

  const limits = {
    diameter: { min: 10, max: 30 }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (Math.abs(Number(newValue) - Number(inputDiameter)) === 1) {
      updateRenderedDiameter(newValue);
    } else {
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

          {/* Cube with Hole */}
          <BoxWithHole diameter={renderedDiameter} />

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