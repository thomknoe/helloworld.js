// src/world/plants/createPlant.js
import * as THREE from "three";
import { parseLSystemString } from "../../algorithms/lsystem.js";

export function createPlant(config, scene) {
  if (!config || !config.lsystem) return null;

  const {
    positionX = 0,
    positionY = 0,
    positionZ = 0,
    branchThickness = 0.1,
    branchColor = "#8B4513", // Default to brown bark color
    leafSize = 0.3,
    leafColor = "#228B22", // Forest green
    leafDensity = 0.7, // Probability of leaves on branch endpoints (0-1)
    lsystem,
  } = config;

  // Parse L-system string into drawing commands
  const commands = parseLSystemString(
    lsystem.resultString,
    lsystem.angle,
    lsystem.stepSize
  );

  // Create group for the plant
  const group = new THREE.Group();
  group.name = "plant";
  // Position - Y will be set by caller to terrain height
  group.position.set(positionX, positionY, positionZ);

  // Bark material - brown, rough texture
  const barkMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(branchColor),
    roughness: 0.95, // Very rough for bark texture
    metalness: 0.0,
  });

  // Leaf material - green, slightly glossy
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(leafColor),
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide, // Leaves visible from both sides
  });

  // Track branch endpoints for leaf placement
  const branchEndpoints = new Set();
  const branchThicknessMap = new Map(); // Track thickness at each point

  // First pass: create branches and track endpoints/thickness
  commands.forEach((cmd) => {
    if (cmd.type === "line") {
      const { from, to } = cmd;
      
      // Calculate branch direction and length
      const direction = new THREE.Vector3(
        to.x - from.x,
        to.y - from.y,
        to.z - from.z
      );
      const length = direction.length();
      
      if (length < 0.001) return; // Skip zero-length branches
      
      direction.normalize();
      
      // Calculate branch thickness based on distance from root
      // Thicker at base, thinner at tips
      const fromDist = Math.sqrt(from.x * from.x + from.y * from.y + from.z * from.z);
      const toDist = Math.sqrt(to.x * to.x + to.y * to.y + to.z * to.z);
      const baseThickness = branchThickness * (1 - fromDist * 0.1); // Thinner as we go up
      const tipThickness = branchThickness * (1 - toDist * 0.1);
      
      // Ensure minimum thickness
      const finalBaseThickness = Math.max(baseThickness, branchThickness * 0.3);
      const finalTipThickness = Math.max(tipThickness, branchThickness * 0.2);
      
      // Store thickness at endpoint
      branchThicknessMap.set(`${to.x},${to.y},${to.z}`, finalTipThickness);
      
      // Mark as endpoint (will be overwritten if this point is a start of another branch)
      branchEndpoints.add(`${to.x},${to.y},${to.z}`);
      
      // Create cylinder for branch
      const geometry = new THREE.CylinderGeometry(
        finalBaseThickness,
        finalTipThickness,
        length,
        8 // More segments for smoother bark
      );
      
      const mesh = new THREE.Mesh(geometry, barkMaterial);
      
      // Position and orient the branch
      const midPoint = new THREE.Vector3(
        (from.x + to.x) / 2,
        (from.y + to.y) / 2,
        (from.z + to.z) / 2
      );
      
      mesh.position.copy(midPoint);
      
      // Orient cylinder along the direction
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(up, direction);
      mesh.quaternion.copy(quaternion);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      group.add(mesh);
    }
  });

  // Second pass: remove endpoints that are also branch starts
  commands.forEach((cmd) => {
    if (cmd.type === "line") {
      const { from } = cmd;
      branchEndpoints.delete(`${from.x},${from.y},${from.z}`);
    }
  });

  // Third pass: add leaves at branch endpoints
  branchEndpoints.forEach((endpointKey) => {
    if (Math.random() > leafDensity) return; // Skip based on density
    
    const [x, y, z] = endpointKey.split(',').map(Number);
    const thickness = branchThicknessMap.get(endpointKey) || branchThickness * 0.3;
    
    // Only add leaves to smaller branches (thinner than 60% of base thickness)
    if (thickness > branchThickness * 0.6) return;
    
    // Create a leaf cluster (3-5 leaves)
    const leafCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < leafCount; i++) {
      // Random offset from branch endpoint
      const offsetX = (Math.random() - 0.5) * leafSize * 0.5;
      const offsetY = (Math.random() - 0.5) * leafSize * 0.5;
      const offsetZ = (Math.random() - 0.5) * leafSize * 0.5;
      
      // Random rotation for natural look
      const rotationX = (Math.random() - 0.5) * Math.PI * 0.5;
      const rotationY = Math.random() * Math.PI * 2;
      const rotationZ = (Math.random() - 0.5) * Math.PI * 0.3;
      
      // Create leaf as a simple plane (can be upgraded to more complex geometry)
      const leafGeometry = new THREE.PlaneGeometry(
        leafSize * (0.8 + Math.random() * 0.4),
        leafSize * (0.6 + Math.random() * 0.4)
      );
      
      const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
      
      leafMesh.position.set(
        x + offsetX,
        y + offsetY,
        z + offsetZ
      );
      
      leafMesh.rotation.set(rotationX, rotationY, rotationZ);
      
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      
      group.add(leafMesh);
    }
  });

  // Add to scene
  scene.add(group);

  return {
    group,
    dispose: () => {
      group.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      scene.remove(group);
    },
    updateConfig: (newConfig) => {
      // For now, just recreate the plant
      // In a more advanced version, we could update materials/positions
      if (newConfig.lsystem?.resultString !== lsystem.resultString) {
        // L-system changed, need to recreate
        return false; // Signal that recreation is needed
      }
      
      // Update position
      group.position.set(
        newConfig.positionX ?? positionX,
        newConfig.positionY ?? positionY,
        newConfig.positionZ ?? positionZ
      );
      
      // Update materials
      barkMaterial.color.set(newConfig.branchColor ?? branchColor);
      leafMaterial.color.set(newConfig.leafColor ?? leafColor);
      
      return true; // Successfully updated
    },
  };
}

