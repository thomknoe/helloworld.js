// src/nodes/factory/simulationNodes.js

// Simple ID generator to avoid extra deps
const makeId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------
// L-System Node
// ---------------------------------------------------------
export function createLSystemNode(position = { x: 0, y: 0 }) {
  return {
    id: makeId("lsystem"),
    type: "lsystem",
    position,
    data: {
      label: "L-System",
      axiom: "F",
      rule1: "F",
      rule1Replacement: "F[+F]F[-F]F",
      rule2: "",
      rule2Replacement: "",
      rule3: "",
      rule3Replacement: "",
      iterations: 3,
      angle: 25,
      stepSize: 1.0,
    },
  };
}

// ---------------------------------------------------------
// Plant Node
// ---------------------------------------------------------
export function createPlantNode(position = { x: 0, y: 0 }) {
  return {
    id: makeId("plant"),
    type: "plant",
    position,
    data: {
      label: "Plant",
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      branchThickness: 0.1,
      branchColor: "#8B4513", // Brown bark color
      leafSize: 0.3,
      leafColor: "#228B22", // Forest green
      leafDensity: 0.7,
    },
  };
}

// ---------------------------------------------------------
// Flower Node
// ---------------------------------------------------------
export function createFlowerNode(position = { x: 0, y: 0 }) {
  return {
    id: makeId("flower"),
    type: "flower",
    position,
    data: {
      label: "Flowers",
      count: 50,
      spread: 50.0,
      size: 1.0, // Increased default size for more prominent flowers
    },
  };
}

