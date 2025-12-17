// src/nodes/factory/agentNodes.js

// Simple ID generator to avoid extra deps
const makeId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------
// Agent Node (one agent per node - white reflective cube)
// ---------------------------------------------------------
export function createAgentNode(position = { x: 0, y: 0 }) {
  // Start with grand dispersal - spread agents widely
  const spread = 100; // Large initial spread
  return {
    id: makeId("agent"),
    type: "agent",
    position,
    data: {
      label: "Agents",
      count: 10,
      positionX: (Math.random() - 0.5) * spread,
      positionY: 50 + (Math.random() - 0.5) * spread * 0.3,
      positionZ: (Math.random() - 0.5) * spread,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: (Math.random() - 0.5) * 1,
      velocityZ: (Math.random() - 0.5) * 4,
      size: 0.3,
      spread: 20.0,
    },
  };
}

// ---------------------------------------------------------
// Flocking Behavior Node
// ---------------------------------------------------------
export function createFlockingNode(position = { x: 0, y: 0 }) {
  return {
    id: makeId("flocking"),
    type: "flocking",
    position,
    data: {
      label: "Flocking Behavior",
      separation: 1.5,
      alignment: 1.0,
      cohesion: 1.0,
      separationRadius: 2.0,
      neighborRadius: 5.0,
      maxSpeed: 5.0,
      maxForce: 0.1,
      boundsWidth: 150,
      boundsDepth: 150,
      planeHeight: 50,
    },
  };
}

